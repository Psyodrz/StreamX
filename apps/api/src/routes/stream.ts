import express, { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { spawn } from 'child_process';
import Song from '../models/Song';
import { generateSignedUrl } from '../services/storage';

const router: Router = express.Router();

const streamLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  message: { success: false, error: { code: 'TOO_MANY_STREAMS', message: 'Rate limit exceeded for streaming.' } }
});

router.get('/:id/stream', streamLimiter, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    let song = null;

    if (/^[0-9a-fA-F]{24}$/.test(id)) {
        song = await Song.findById(id);
    }
    
    // We purposefully don't return 404 here anymore if the song isn't in the DB, 
    // because it might be a raw YouTube video ID.

    // 1. If there is an internal URL mapped directly to GCS path
    if (song && song.internalAudioUrl) {
      const url = await generateSignedUrl(song.internalAudioUrl);
      
      if (url) {
        return res.json({
          success: true,
          streamUrl: url,
          source: 'internal'
        });
      }
    }

    // 2. Fallback to YouTube proxy stream URL
    // If it's a valid MongoDB ID but has no internal stream, or if it's a raw video ID
    let streamVideoId = song ? song.youtubeVideoId : id;
    let streamSongId = song ? song._id : id;

    if (streamVideoId) {
       // Return a URL pointing to our proxy endpoint
       const host = req.get('host');
       const protocol = req.protocol;
       const streamUrl = `${protocol}://${host}/api/v1/songs/${streamSongId}/audio`;
       
       return res.json({
          success: true,
          streamUrl,
          source: 'youtube'
       });
    }

    return res.status(404).json({ 
        success: false, 
        error: { code: 'NO_STREAM_AVAILABLE', message: 'No internal stream or YouTube fallback available.' } 
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'STREAM_FAILED', message: error.message } });
  }
});

// The actual proxy streaming route — uses yt-dlp + ffmpeg to pipe audio
router.get('/:id/audio', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    let videoId = id;
    let songTitle = 'YouTube Audio';

    // Check if the ID is a valid MongoDB ObjectID (24 hex characters)
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
        const song = await Song.findById(id);
        if (!song || !song.youtubeVideoId) {
            console.log(`[AudioProxy] Song ${id} not found in DB or no youtube ID`);
            return res.status(404).send('Not found');
        }
        videoId = song.youtubeVideoId;
        songTitle = song.title;
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`[AudioProxy] Streaming: ${songTitle} (${videoUrl})`);

    // Set headers for the audio response
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Use yt-dlp to extract the audio URL + ffmpeg to transcode to mp3 and pipe to response
    // yt-dlp pipes raw audio to stdout, ffmpeg converts it to mp3 on the fly
    const ytdlp = spawn('yt-dlp', [
      '-f', 'bestaudio',
      '--cookies', 'cookies.txt', // Switched to cookies.txt because of Chrome database lock
      '-o', '-',           // output to stdout
      '--no-warnings',
      '--no-playlist',
      videoUrl
    ]);

    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0',        // read from stdin (yt-dlp output)
      '-f', 'mp3',           // output format
      '-ab', '192k',         // 192kbps bitrate
      '-vn',                 // no video
      '-loglevel', 'error',
      'pipe:1'               // output to stdout
    ]);

    // Pipe yt-dlp stdout -> ffmpeg stdin
    ytdlp.stdout.pipe(ffmpeg.stdin);

    // Pipe ffmpeg stdout -> HTTP response
    ffmpeg.stdout.pipe(res);

    // Error handling
    ytdlp.stderr.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.error(`[AudioProxy] yt-dlp stderr: ${msg}`);
    });

    ffmpeg.stderr.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.error(`[AudioProxy] ffmpeg stderr: ${msg}`);
    });

    ytdlp.on('error', (err) => {
      console.error(`[AudioProxy] yt-dlp spawn error:`, err.message);
      if (!res.headersSent) res.status(500).send('yt-dlp error');
    });

    ffmpeg.on('error', (err) => {
      console.error(`[AudioProxy] ffmpeg spawn error:`, err.message);
      if (!res.headersSent) res.status(500).send('ffmpeg error');
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        console.error(`[AudioProxy] yt-dlp exited with code ${code}`);
      }
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`[AudioProxy] ffmpeg exited with code ${code}`);
      }
    });

    // If the client disconnects, kill the child processes
    res.on('close', () => {
      console.log(`[AudioProxy] Client disconnected, killing stream processes for ${songTitle}`);
      ytdlp.kill('SIGTERM');
      ffmpeg.kill('SIGTERM');
    });

  } catch (err: any) {
    console.error('[AudioProxy] Error:', err.message);
    if (!res.headersSent) res.status(500).send(`Error: ${err.message}`);
  }
});

export default router;

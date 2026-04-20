'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Play, Pause, Music, Sparkles, Loader2, PlayCircle, Share2, MoreVertical } from 'lucide-react';
import { StreamXAPI, Song } from '@streamx/shared';
import { usePlayerStore } from '@streamx/store';

interface AIPlaylistTrack {
  _id?: string;
  youtubeVideoId?: string;
  title: string;
  artist: string;
  albumArt?: string;
  duration?: number;
  unhydrated?: boolean;
}

interface AIPlaylist {
  id: string;
  name: string;
  description: string;
  coverQuery: string;
  songs: AIPlaylistTrack[];
  type: string;
}

export default function AIPlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const play = usePlayerStore((state) => state.play);
  const pause = usePlayerStore((state) => state.pause);
  const queueTracks = usePlayerStore((state) => state.addMultipleToQueue);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTrack = usePlayerStore((state) => state.currentTrack);

  const [playlist, setPlaylist] = useState<AIPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrationProgress, setHydrationProgress] = useState(0);

  useEffect(() => {
    const fetchPlaylist = async () => {
      setLoading(true);
      try {
        const data = await StreamXAPI.getAIPlaylistById(params.id as string);
        setPlaylist(data);
        
        // Check if any tracks need computing/hydrating
        const needsHydration = data.songs.filter(s => s.unhydrated);
        if (needsHydration.length > 0) {
          hydrateTracks(data, needsHydration);
        }
      } catch (err) {
        console.error('Failed to fetch AI playlist:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPlaylist();
    }
  }, [params.id]);

  const hydrateTracks = async (pl: AIPlaylist, tracksToHydrate: AIPlaylistTrack[]) => {
    setIsHydrating(true);
    try {
      // Chunking the hydration out to avoid long Vercel timeouts if we're on a serverless Edge
      const chunkSize = 15;
      let hydratedData: any[] = [];
      
      for (let i = 0; i < tracksToHydrate.length; i += chunkSize) {
        const chunk = tracksToHydrate.slice(i, i + chunkSize);
        const result = await StreamXAPI.hydrateAITracks(chunk.map(t => ({ title: t.title, artist: t.artist })));
        hydratedData = [...hydratedData, ...result];
        setHydrationProgress(Math.round(((i + chunk.length) / tracksToHydrate.length) * 100));
        
        // Optimistically update the UI as chunks arrive
        setPlaylist(prev => {
          if (!prev) return prev;
          const newSongs = [...prev.songs];
          for (const hydratedTrack of result) {
            // Find track with matching title
            const index = newSongs.findIndex(s => s.unhydrated && s.title === hydratedTrack.title);
            if (index !== -1) {
              newSongs[index] = hydratedTrack;
            }
          }
          return { ...prev, songs: newSongs };
        });
      }

    } catch (err) {
      console.error('Hydration failed:', err);
    } finally {
      setIsHydrating(false);
    }
  };

  const handlePlayTrack = (song: AIPlaylistTrack) => {
    if (song.unhydrated) return; // Can't play unhydrated track

    if (currentTrack?.id === song._id && isPlaying) {
      pause();
    } else {
      // Create a playable track object
      play({
        id: song._id!,
        title: song.title,
        artist: song.artist,
        artwork: song.albumArt || playlist?.coverQuery || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17',
        duration: song.duration!,
      });

      // Optionally, queue the rest of the fully hydrated songs below it
      if (playlist) {
        const playableRemaining = playlist.songs
          .filter(s => !s.unhydrated && s._id !== song._id)
          .map(s => ({
            id: s._id!,
            title: s.title,
            artist: s.artist,
            artwork: s.albumArt || playlist.coverQuery,
            duration: s.duration!,
          }));
        if (playableRemaining.length > 0) {
           queueTracks(playableRemaining);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto flex items-center justify-center py-40">
         <div className="flex flex-col items-center gap-4 text-amethyst-light">
           <Loader2 size={40} className="animate-spin" />
           <span>Loading Playlist...</span>
         </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto text-center py-20 flex flex-col items-center gap-4">
        <Sparkles size={48} className="text-white/20" />
        <h2 className="text-2xl font-bold text-white">Playlist expired or not found</h2>
        <p className="text-white/50">Playlists regenerate every 30 minutes. Go back home to discover fresh ones.</p>
        <button onClick={() => router.push('/')} className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
          Back Home
        </button>
      </div>
    );
  }

  const formatTime = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fullyHydratedCount = playlist.songs.filter(s => !s.unhydrated).length;
  const isFullyHydrated = fullyHydratedCount === playlist.songs.length;

  return (
    <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto pb-32">
      {/* Playlist Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="w-52 h-52 lg:w-64 lg:h-64 rounded-2xl bg-gradient-to-br from-amethyst/40 to-coral/40 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-2xl overflow-hidden shadow-amethyst/10">
          {playlist.coverQuery ? (
            <img src={playlist.coverQuery} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <Sparkles size={64} className="text-white/30" />
          )}
        </div>

        <div className="flex-1 flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-amethyst-light" />
            <span className="text-xs font-bold text-amethyst-light uppercase tracking-wider">Curated • {playlist.type}</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white mb-4 tracking-tight">{playlist.name}</h1>
          <p className="text-white/60 text-sm md:text-base lg:text-lg mb-6 max-w-2xl">{playlist.description}</p>
          
          <div className="flex items-center gap-3 text-sm text-white/50">
            <span>StreamX Curated</span>
            <span>•</span>
            <span>{playlist.songs.length} tracks</span>
            {isHydrating && (
              <>
                <span>•</span>
                <span className="flex items-center gap-2 text-coral">
                  <Loader2 size={14} className="animate-spin" />
                  Resolving tracks ({hydrationProgress}%)
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Play Action */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          disabled={fullyHydratedCount === 0}
          onClick={() => {
             const firstPlayable = playlist.songs.find(s => !s.unhydrated);
             if (firstPlayable) handlePlayTrack(firstPlayable);
          }}
          className="w-14 h-14 bg-amethyst hover:bg-amethyst-light disabled:bg-amethyst/50 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-xl shadow-amethyst/20"
        >
          <Play size={28} fill="currentColor" className="ml-1" />
        </button>
        <button className="w-10 h-10 border border-white/20 hover:border-white/50 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all">
          <Share2 size={18} />
        </button>
        <button className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-1 w-full">
        {playlist.songs.map((song, index) => {
          const isCurrentTrack = currentTrack?.id === song._id;
          const isPlayable = !song.unhydrated;

          return (
            <div
              key={song._id || `unhydrated-${index}`}
              className={`group flex items-center gap-4 p-3 rounded-xl transition-colors ${
                isCurrentTrack ? 'bg-white/10' : isPlayable ? 'hover:bg-white/5 cursor-pointer' : 'opacity-50'
              }`}
              onClick={() => handlePlayTrack(song)}
            >
              <div className="w-8 flex items-center justify-center text-white/40 text-sm">
                 {isCurrentTrack && isPlaying ? (
                    <div className="flex items-center justify-center gap-0.5">
                      <span className="w-1 h-3 bg-amethyst animate-pulse rounded-full" />
                      <span className="w-1 h-4 bg-amethyst animate-pulse delay-75 rounded-full" />
                      <span className="w-1 h-2 bg-amethyst animate-pulse delay-150 rounded-full" />
                    </div>
                 ) : !isPlayable ? (
                    <Loader2 size={14} className="animate-spin" />
                 ) : (
                    <span className="group-hover:hidden">{index + 1}</span>
                 )}
                 {isPlayable && !isCurrentTrack && (
                    <Play size={16} fill="currentColor" className="hidden group-hover:block text-white" />
                 )}
              </div>

              {/* Album Art */}
              <div className="w-10 h-10 rounded overflow-hidden bg-white/5 flex-shrink-0">
                {song.albumArt ? (
                   <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center">
                     <Music size={16} className="text-white/20" />
                   </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pr-4">
                <div className={`font-medium truncate ${isCurrentTrack ? 'text-amethyst-light' : 'text-white'}`}>
                  {song.title}
                </div>
                <div className="text-sm text-white/50 truncate">
                  {song.artist}
                </div>
              </div>

              {/* Duration */}
              <div className="text-sm text-white/40 hidden md:block w-16 text-right">
                 {formatTime(song.duration)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

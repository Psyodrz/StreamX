'use client';

import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore } from '@streamx/store';
import { NowPlayingView } from './NowPlayingView';

export const PlayerBar = () => {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const skipToNext = usePlayerStore((s) => s.skipToNext);
  const skipToPrevious = usePlayerStore((s) => s.skipToPrevious);

  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);

  if (!currentTrack) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    seek(percent * duration);
  };

  const handleVolumeScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    setVolume(percent);
  };

  const toggleMute = () => setVolume(volume > 0 ? 0 : 1);

  /** Stop button clicks from also opening the fullscreen view */
  const stopProp = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      {/* Full-screen Now Playing overlay */}
      <NowPlayingView isOpen={isNowPlayingOpen} onClose={() => setIsNowPlayingOpen(false)} />

      {/* ── Mobile Player Bar ── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 cursor-pointer"
        onClick={() => setIsNowPlayingOpen(true)}
      >
        {/* Progress line on top */}
        <div className="h-[2px] bg-white/10 w-full">
          <div
            className="h-full bg-gradient-to-r from-amethyst to-amethyst-light transition-[width] duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5 px-3 py-2 flex items-center gap-3">
          {/* Album art */}
          {currentTrack.artwork ? (
            <img src={currentTrack.artwork} alt="" className="w-11 h-11 rounded-md object-cover flex-shrink-0" />
          ) : (
            <div className="w-11 h-11 bg-white/5 rounded-md flex-shrink-0" />
          )}

          {/* Title + Artist */}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold text-white truncate">{currentTrack.title}</span>
            <span className="text-[11px] text-white/40 truncate">{currentTrack.artist}</span>
          </div>

          {/* Controls */}
          <button
            onClick={(e) => { stopProp(e); isPlaying ? pause() : resume(); }}
            className="w-10 h-10 flex items-center justify-center text-white"
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
          </button>
          <button
            onClick={(e) => { stopProp(e); skipToNext(); }}
            className="w-8 h-8 flex items-center justify-center text-white/50"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* ── Desktop Player Bar ── */}
      <div
        className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 h-20 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5 items-center px-6 cursor-pointer"
        onClick={() => setIsNowPlayingOpen(true)}
      >
        {/* Left: Track Info */}
        <div className="flex items-center gap-4 w-1/4 min-w-[220px]">
          {currentTrack.artwork ? (
            <img
              src={currentTrack.artwork}
              alt=""
              className={`w-12 h-12 rounded-md object-cover shadow-lg ${isPlaying ? 'shadow-amethyst/20' : ''}`}
            />
          ) : (
            <div className="w-12 h-12 bg-white/5 rounded-md" />
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate text-white">{currentTrack.title}</span>
            <span className="text-xs text-white/40 truncate">{currentTrack.artist}</span>
          </div>
        </div>

        {/* Center: Controls + Scrubber */}
        <div className="flex flex-col items-center max-w-xl w-full gap-1.5 mx-auto" onClick={stopProp}>
          <div className="flex items-center gap-5">
            <button onClick={skipToPrevious} className="text-white/40 hover:text-white transition-colors">
              <SkipBack size={18} />
            </button>

            <button
              onClick={isPlaying ? pause : resume}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>

            <button onClick={skipToNext} className="text-white/40 hover:text-white transition-colors">
              <SkipForward size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full text-[11px] text-white/30">
            <span className="w-8 text-right">{formatTime(progress)}</span>
            <div
              className="h-1 bg-white/10 rounded-full flex-grow cursor-pointer relative overflow-hidden group"
              onClick={handleScrub}
            >
              <div
                className="absolute top-0 left-0 bottom-0 bg-white rounded-full group-hover:bg-amethyst-light transition-colors"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="w-8">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume */}
        <div className="flex items-center justify-end w-1/4 min-w-[150px] gap-2 text-white/40" onClick={stopProp}>
          <button onClick={toggleMute} className="hover:text-white transition-colors">
            {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <div
            className="h-1 w-24 bg-white/10 rounded-full cursor-pointer relative overflow-hidden group"
            onClick={handleVolumeScrub}
          >
            <div
              className="absolute top-0 left-0 bottom-0 bg-white/60 rounded-full group-hover:bg-amethyst-light transition-colors"
              style={{ width: `${volume * 100}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Heart,
  ListMusic,
  Music,
  Share2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { usePlayerStore } from '@streamx/store';

interface NowPlayingViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NowPlayingView: React.FC<NowPlayingViewProps> = ({ isOpen, onClose }) => {
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
  const queue = usePlayerStore((s) => s.queue);
  const smartShuffleEnabled = usePlayerStore((s) => s.smartShuffleEnabled);
  const toggleSmartShuffle = usePlayerStore((s) => s.toggleSmartShuffle);
  const isLoadingSuggestions = usePlayerStore((s) => s.isLoadingSuggestions);

  const [liked, setLiked] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!currentTrack) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const displayProgress = isDragging ? dragProgress : progress;
  const progressPercent = duration > 0 ? (displayProgress / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    seek(percent * duration);
  };

  const handleProgressDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    setDragProgress(percent * duration);
  };

  const handleProgressDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    setDragProgress(percent * duration);
  };

  const handleProgressDragEnd = () => {
    if (isDragging) {
      seek(dragProgress);
      setIsDragging(false);
    }
  };

  const handleVolumeScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    setVolume(percent);
  };

  const toggleMute = () => setVolume(volume > 0 ? 0 : 1);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[200] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Background with blurred album art */}
        <div className="absolute inset-0 overflow-hidden">
          {currentTrack.artwork && (
            <img
              src={currentTrack.artwork}
              alt=""
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-[80px] opacity-40"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#050508]/80 to-[#050508]" />
        </div>

        {/* Content */}
        <div
          className={`relative h-full flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            isOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          onMouseMove={handleProgressDragMove}
          onMouseUp={handleProgressDragEnd}
          onMouseLeave={handleProgressDragEnd}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            >
              <ChevronDown size={28} />
            </button>
            <div className="text-center">
              <p className="text-[10px] font-semibold tracking-[3px] text-white/40 uppercase">
                Now Playing
              </p>
              <p className="text-xs text-white/60 mt-0.5">{currentTrack.artist}</p>
            </div>
            <button
              onClick={() => setShowQueue(!showQueue)}
              className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors ${
                showQueue ? 'text-amethyst-light' : 'text-white/70 hover:text-white'
              }`}
            >
              <ListMusic size={22} />
            </button>
          </div>

          {/* ── Main Content Area ── */}
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 px-6 md:px-16 overflow-hidden">
            {/* Album Art */}
            <div
              className={`flex-shrink-0 transition-all duration-700 ${
                showQueue ? 'w-[200px] md:w-[280px]' : 'w-[280px] md:w-[400px] lg:w-[440px]'
              }`}
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/60 group">
                {currentTrack.artwork ? (
                  <img
                    src={currentTrack.artwork}
                    alt={currentTrack.title}
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                      isPlaying ? 'scale-100' : 'scale-95'
                    }`}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amethyst/30 to-coral/30 flex items-center justify-center">
                    <Music size={48} className="text-white/20" />
                  </div>
                )}
                {/* Vinyl effect glow */}
                <div
                  className={`absolute inset-0 rounded-2xl transition-opacity duration-500 ${
                    isPlaying ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    boxShadow: 'inset 0 0 60px rgba(124, 58, 237, 0.15), 0 0 80px rgba(124, 58, 237, 0.1)',
                  }}
                />
              </div>
            </div>

            {/* Right side: Track info + Controls OR Queue */}
            <div className={`flex flex-col w-full max-w-md ${showQueue ? 'md:max-w-lg' : ''}`}>
              {!showQueue ? (
                <>
                  {/* Track Info */}
                  <div className="mb-8 md:mb-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-2xl md:text-3xl font-bold text-white truncate leading-tight">
                          {currentTrack.title}
                        </h2>
                        <p className="text-base md:text-lg text-white/50 mt-1 truncate">
                          {currentTrack.artist}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                        <button
                          onClick={() => setLiked(!liked)}
                          className={`p-2 rounded-full transition-all ${
                            liked
                              ? 'text-pink-500 hover:text-pink-400'
                              : 'text-white/30 hover:text-white/60'
                          }`}
                        >
                          <Heart size={22} fill={liked ? 'currentColor' : 'none'} />
                        </button>
                        <button className="p-2 rounded-full text-white/30 hover:text-white/60 transition-colors">
                          <Share2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div
                      ref={progressRef}
                      className="h-1.5 bg-white/10 rounded-full cursor-pointer relative overflow-hidden group"
                      onClick={handleProgressClick}
                      onMouseDown={handleProgressDragStart}
                    >
                      <div
                        className="absolute top-0 left-0 bottom-0 bg-white rounded-full group-hover:bg-amethyst-light transition-colors"
                        style={{ width: `${progressPercent}%` }}
                      />
                      {/* Drag handle */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ left: `calc(${progressPercent}% - 8px)` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-white/30">
                      <span>{formatTime(displayProgress)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Main Controls */}
                  <div className="flex items-center justify-between mb-8">
                    {/* Smart Shuffle Toggle */}
                    <button
                      onClick={toggleSmartShuffle}
                      className={`relative p-2 rounded-full transition-all ${
                        smartShuffleEnabled
                          ? 'text-amethyst-light bg-amethyst/20 shadow-lg shadow-amethyst/20'
                          : 'text-white/30 hover:text-white'
                      }`}
                      title={smartShuffleEnabled ? 'Smart Shuffle ON — predicting your vibe' : 'Enable Smart Shuffle'}
                    >
                      {isLoadingSuggestions ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Sparkles size={20} />
                      )}
                      {smartShuffleEnabled && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-amethyst-light rounded-full animate-pulse" />
                      )}
                    </button>

                    <div className="flex items-center gap-6">
                      <button
                        onClick={skipToPrevious}
                        className="text-white/60 hover:text-white transition-colors p-2"
                      >
                        <SkipBack size={28} fill="currentColor" />
                      </button>

                      <button
                        onClick={isPlaying ? pause : resume}
                        className="w-16 h-16 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-transform shadow-xl shadow-white/10"
                      >
                        {isPlaying ? (
                          <Pause size={28} fill="currentColor" />
                        ) : (
                          <Play size={28} fill="currentColor" className="ml-1" />
                        )}
                      </button>

                      <button
                        onClick={skipToNext}
                        className="text-white/60 hover:text-white transition-colors p-2"
                      >
                        <SkipForward size={28} fill="currentColor" />
                      </button>
                    </div>

                    <button className="text-white/30 hover:text-white transition-colors p-2">
                      <Repeat size={20} />
                    </button>
                  </div>

                  {/* Smart Shuffle indicator */}
                  {smartShuffleEnabled && (
                    <div className="flex items-center justify-center gap-2 mb-4 text-xs text-amethyst-light/70">
                      <Sparkles size={12} />
                      <span>{isLoadingSuggestions ? 'Finding your next songs...' : 'Smart Shuffle is active'}</span>
                    </div>
                  )}

                  {/* Volume (desktop only) */}
                  <div className="hidden md:flex items-center gap-3 text-white/40">
                    <button onClick={toggleMute} className="hover:text-white transition-colors">
                      {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <div
                      className="h-1 flex-1 max-w-[200px] bg-white/10 rounded-full cursor-pointer relative overflow-hidden group"
                      onClick={handleVolumeScrub}
                    >
                      <div
                        className="absolute top-0 left-0 bottom-0 bg-white/60 rounded-full group-hover:bg-amethyst-light transition-colors"
                        style={{ width: `${volume * 100}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* ── Queue View ── */
                <div className="flex flex-col h-full max-h-[60vh] md:max-h-[50vh]">
                  <h3 className="text-lg font-bold text-white mb-4">Up Next</h3>
                  {queue.length > 0 ? (
                    <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-2">
                      {queue.map((track, idx) => (
                        <div
                          key={`${track.id}-${idx}`}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                        >
                          <span className="w-6 text-center text-xs text-white/20 group-hover:hidden">
                            {idx + 1}
                          </span>
                          <Play
                            size={14}
                            className="hidden group-hover:block text-white w-6 text-center"
                            fill="currentColor"
                          />
                          {track.artwork ? (
                            <img
                              src={track.artwork}
                              alt=""
                              className="w-10 h-10 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-white/5 rounded flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-white truncate">{track.title}</p>
                            <p className="text-xs text-white/30 truncate">{track.artist}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
                      Queue is empty
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom spacer */}
          <div className="h-6 md:h-10" />
        </div>
      </div>
    </>
  );
};

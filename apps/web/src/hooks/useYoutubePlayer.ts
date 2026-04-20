'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@streamx/store';
import type { PlayerMethods } from '@streamx/store';

/* ─────────────────────────────────────────────
 * YouTube IFrame Player API type declarations
 * ───────────────────────────────────────────── */
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: Record<string, unknown>,
      ) => YTPlayer;
      PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
    };
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface YTPlayer {
  loadVideoById(videoId: string): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  getDuration(): number;
  getCurrentTime(): number;
  getPlayerState(): number;
  destroy(): void;
}

/* ─────────────────────────────────────────────
 * Hook: useYoutubePlayer
 *
 * Manages a hidden YouTube IFrame player and
 * bridges it to the shared Zustand player store.
 * ───────────────────────────────────────────── */
export const useYoutubePlayer = () => {
  const playerRef = useRef<YTPlayer | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isReadyRef = useRef(false);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const setPlaybackState = usePlayerStore((s) => s.setPlaybackState);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setPlayerMethods = usePlayerStore((s) => s.setPlayerMethods);

  /* ── Progress polling ── */
  const startProgressPolling = useCallback(() => {
    stopProgressPolling();
    progressTimerRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        setProgress(playerRef.current.getCurrentTime());
      }
    }, 500);
  }, [setProgress]);

  const stopProgressPolling = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  /* ── Player event handlers ── */
  const onPlayerReady = useCallback(() => {
    isReadyRef.current = true;

    const methods: PlayerMethods = {
      play: () => playerRef.current?.playVideo(),
      pause: () => playerRef.current?.pauseVideo(),
      seekTo: (s) => playerRef.current?.seekTo(s, true),
      setVolume: (v) => playerRef.current?.setVolume(v * 100),
    };

    setPlayerMethods(methods);

    // If a track was already set before the player was ready, load it now
    const track = usePlayerStore.getState().currentTrack;
    if (track?.id) {
      playerRef.current?.loadVideoById(track.id);
    }
  }, [setPlayerMethods]);

  const onPlayerStateChange = useCallback(
    (event: { data: number }) => {
      switch (event.data) {
        case 1: // PLAYING
          setPlaybackState(true);
          if (playerRef.current) {
            setDuration(playerRef.current.getDuration());
          }
          startProgressPolling();
          break;

        case 2: // PAUSED
          setPlaybackState(false);
          stopProgressPolling();
          break;

        case 0: // ENDED
          setPlaybackState(false);
          stopProgressPolling();
          usePlayerStore.getState().skipToNext();
          break;

        case 3: // BUFFERING
          // nothing special — UI can show a buffering spinner via store if needed
          break;

        default:
          break;
      }
    },
    [setPlaybackState, setDuration, startProgressPolling, stopProgressPolling],
  );

  const onPlayerError = useCallback(
    (event: { data: number }) => {
      console.error('[YT Player] Error code:', event.data);
      stopProgressPolling();
      setPlaybackState(false);
    },
    [stopProgressPolling, setPlaybackState],
  );

  /* ── Initialize the YT.Player instance ── */
  const initializePlayer = useCallback(() => {
    if (!window.YT?.Player) return;

    playerRef.current = new window.YT.Player('youtube-audio-player', {
      height: '1',
      width: '1',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0,
        origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError,
      },
    });
  }, [onPlayerReady, onPlayerStateChange, onPlayerError]);

  /* ── Load the IFrame API script ── */
  useEffect(() => {
    if (window.YT?.Player) {
      // API already loaded (e.g. HMR), just create the player
      if (!playerRef.current) initializePlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.id = 'yt-iframe-api';
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript?.parentNode?.insertBefore(tag, firstScript);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    }

    return () => {
      stopProgressPolling();
      setPlayerMethods(null);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      isReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── React to track changes from the store ── */
  useEffect(() => {
    if (isReadyRef.current && currentTrack?.id && playerRef.current) {
      playerRef.current.loadVideoById(currentTrack.id);
    }
  }, [currentTrack?.id]);

  return null;
};

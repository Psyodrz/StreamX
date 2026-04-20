'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore, Track } from '@streamx/store';
import { StreamXAPI } from '@streamx/shared';

/**
 * useSmartShuffle — automatically refills the queue with AI-suggested
 * songs when Smart Shuffle is enabled and the queue is running low.
 *
 * Mount this once at the app root (e.g., in layout or YoutubePlayerProvider).
 */
export function useSmartShuffle() {
  const smartShuffleEnabled = usePlayerStore((s) => s.smartShuffleEnabled);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const queue = usePlayerStore((s) => s.queue);
  const listeningHistory = usePlayerStore((s) => s.listeningHistory);
  const isLoadingSuggestions = usePlayerStore((s) => s.isLoadingSuggestions);

  const isFetching = useRef(false);

  const fetchSuggestions = useCallback(async () => {
    if (isFetching.current) return;
    if (listeningHistory.length < 1) return;

    isFetching.current = true;
    usePlayerStore.getState().setLoadingSuggestions(true);

    try {
      const history = listeningHistory.map((t) => ({
        title: t.title,
        artist: t.artist,
      }));

      const suggestions = await StreamXAPI.smartShuffle(history, 5);

      if (suggestions && Array.isArray(suggestions) && suggestions.length > 0) {
        const tracks: Track[] = suggestions.map((s: any) => ({
          id: s.youtubeVideoId || s._id,
          title: s.title,
          artist: s.artist,
          artwork: s.albumArt,
          duration: s.duration,
        }));

        usePlayerStore.getState().addMultipleToQueue(tracks);

        // If nothing is playing (queue was empty), start the first suggestion
        const state = usePlayerStore.getState();
        if (!state.isPlaying && !state.currentTrack && tracks.length > 0) {
          usePlayerStore.getState().play(tracks[0]);
        }
      }
    } catch (err) {
      console.error('[SmartShuffle] Failed to fetch suggestions:', err);
    } finally {
      isFetching.current = false;
      usePlayerStore.getState().setLoadingSuggestions(false);
    }
  }, [listeningHistory]);

  useEffect(() => {
    if (!smartShuffleEnabled || !currentTrack) return;

    // Calculate remaining songs in queue after current track
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const remaining = idx >= 0 ? queue.length - idx - 1 : 0;

    // Refill when 2 or fewer songs remain
    if (remaining <= 2 && !isLoadingSuggestions && !isFetching.current) {
      fetchSuggestions();
    }
  }, [smartShuffleEnabled, currentTrack, queue, isLoadingSuggestions, fetchSuggestions]);
}

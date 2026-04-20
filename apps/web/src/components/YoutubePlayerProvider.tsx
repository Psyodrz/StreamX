'use client';

import { useYoutubePlayer } from '../hooks/useYoutubePlayer';
import { useSmartShuffle } from '../hooks/useSmartShuffle';

/**
 * Mounts a hidden YouTube IFrame player into the DOM.
 *
 * The div must NOT use `display: none` — the YT IFrame API requires
 * the container to be in the layout. We hide it with `position: fixed`
 * off-screen + `opacity: 0` + `pointer-events: none` so it's invisible
 * but still active.
 */
export const YoutubePlayerProvider = () => {
  useYoutubePlayer();
  useSmartShuffle();

  return (
    <div
      id="youtube-audio-player"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: -9999,
        left: -9999,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    />
  );
};

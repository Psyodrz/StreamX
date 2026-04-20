"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePlayerStore = void 0;
const zustand_1 = require("zustand");
const MAX_HISTORY = 15;
exports.usePlayerStore = (0, zustand_1.create)((set, get) => ({
    currentTrack: null,
    isPlaying: false,
    queue: [],
    volume: 1.0,
    progress: 0,
    duration: 0,
    playerMethods: null,
    // Smart Shuffle
    smartShuffleEnabled: false,
    listeningHistory: [],
    isLoadingSuggestions: false,
    // ── State setters ──
    setPlaybackState: (isPlaying) => set({ isPlaying }),
    setProgress: (seconds) => set({ progress: seconds }),
    setDuration: (seconds) => set({ duration: seconds }),
    setPlayerMethods: (methods) => set({ playerMethods: methods }),
    setLoadingSuggestions: (loading) => set({ isLoadingSuggestions: loading }),
    // ── UI-facing actions ──
    play: (track) => {
        const { queue, listeningHistory } = get();
        // If the track isn't already in the queue, prepend it
        const alreadyInQueue = queue.some((t) => t.id === track.id);
        const newQueue = alreadyInQueue ? queue : [track, ...queue];
        // Add to listening history (keep last MAX_HISTORY)
        const newHistory = [...listeningHistory, track].slice(-MAX_HISTORY);
        set({
            currentTrack: track,
            queue: newQueue,
            isPlaying: true,
            progress: 0,
            duration: track.duration || 0,
            listeningHistory: newHistory,
        });
        // Note: the platform-specific player component will react to
        // `currentTrack.id` changing and call loadVideoById / postMessage.
    },
    pause: () => {
        const { playerMethods } = get();
        playerMethods?.pause();
        set({ isPlaying: false });
    },
    resume: () => {
        const { playerMethods } = get();
        playerMethods?.play();
        set({ isPlaying: true });
    },
    skipToNext: () => {
        const { queue, currentTrack, listeningHistory } = get();
        if (!currentTrack || queue.length <= 1)
            return;
        const idx = queue.findIndex((t) => t.id === currentTrack.id);
        if (idx < queue.length - 1) {
            const next = queue[idx + 1];
            const newHistory = [...listeningHistory, next].slice(-MAX_HISTORY);
            set({
                currentTrack: next,
                isPlaying: true,
                progress: 0,
                duration: next.duration || 0,
                listeningHistory: newHistory,
            });
        }
    },
    skipToPrevious: () => {
        const { queue, currentTrack, progress } = get();
        if (!currentTrack)
            return;
        // If we're more than 3 seconds into the track, restart it instead
        if (progress > 3) {
            const { playerMethods } = get();
            playerMethods?.seekTo(0);
            set({ progress: 0 });
            return;
        }
        if (queue.length <= 1)
            return;
        const idx = queue.findIndex((t) => t.id === currentTrack.id);
        if (idx > 0) {
            const prev = queue[idx - 1];
            set({ currentTrack: prev, isPlaying: true, progress: 0, duration: prev.duration || 0 });
        }
    },
    setVolume: (vol) => {
        const { playerMethods } = get();
        playerMethods?.setVolume(vol);
        set({ volume: vol });
    },
    seek: (seconds) => {
        const { playerMethods } = get();
        playerMethods?.seekTo(seconds);
        set({ progress: seconds });
    },
    addToQueue: (track) => {
        const { queue } = get();
        if (queue.some((t) => t.id === track.id))
            return; // no duplicates
        set({ queue: [...queue, track] });
    },
    addMultipleToQueue: (tracks) => {
        const { queue } = get();
        const existingIds = new Set(queue.map((t) => t.id));
        const newTracks = tracks.filter((t) => !existingIds.has(t.id));
        if (newTracks.length > 0) {
            set({ queue: [...queue, ...newTracks] });
        }
    },
    toggleSmartShuffle: () => {
        set((s) => ({ smartShuffleEnabled: !s.smartShuffleEnabled }));
    },
    onTrackEnd: () => {
        // Auto-advance to next track in queue
        const { queue, currentTrack } = get();
        if (!currentTrack)
            return;
        const idx = queue.findIndex((t) => t.id === currentTrack.id);
        if (idx < queue.length - 1) {
            const next = queue[idx + 1];
            const { listeningHistory } = get();
            const newHistory = [...listeningHistory, next].slice(-MAX_HISTORY);
            set({
                currentTrack: next,
                isPlaying: true,
                progress: 0,
                duration: next.duration || 0,
                listeningHistory: newHistory,
            });
        }
        else {
            // Queue exhausted
            set({ isPlaying: false, progress: 0 });
        }
    },
}));
//# sourceMappingURL=playerStore.js.map
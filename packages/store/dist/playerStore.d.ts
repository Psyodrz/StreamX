/** Represents a playable track across both web and mobile. */
export interface Track {
    /** YouTube Video ID — used by the IFrame/WebView to load the video. */
    id: string;
    title: string;
    artist: string;
    artwork?: string;
    /** Duration in seconds. Initially from search metadata, updated by player on load. */
    duration?: number;
}
/**
 * Platform-specific player methods injected at runtime.
 * - Web: set by `useYoutubePlayer` hook via YT.Player instance
 * - Mobile: set by `YoutubePlayer` component via WebView postMessage bridge
 */
export interface PlayerMethods {
    play: () => void;
    pause: () => void;
    seekTo: (seconds: number) => void;
    setVolume: (vol: number) => void;
}
interface PlayerState {
    currentTrack: Track | null;
    isPlaying: boolean;
    queue: Track[];
    volume: number;
    progress: number;
    duration: number;
    smartShuffleEnabled: boolean;
    listeningHistory: Track[];
    isLoadingSuggestions: boolean;
    setPlaybackState: (isPlaying: boolean) => void;
    setProgress: (seconds: number) => void;
    setDuration: (seconds: number) => void;
    play: (track: Track) => void;
    pause: () => void;
    resume: () => void;
    skipToNext: () => void;
    skipToPrevious: () => void;
    setVolume: (vol: number) => void;
    seek: (seconds: number) => void;
    addToQueue: (track: Track) => void;
    addMultipleToQueue: (tracks: Track[]) => void;
    toggleSmartShuffle: () => void;
    setLoadingSuggestions: (loading: boolean) => void;
    onTrackEnd: () => void;
    playerMethods: PlayerMethods | null;
    setPlayerMethods: (methods: PlayerMethods | null) => void;
}
export declare const usePlayerStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PlayerState>>;
export {};
//# sourceMappingURL=playerStore.d.ts.map
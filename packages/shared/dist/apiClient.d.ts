import { Song } from './index';
export declare const StreamXAPI: {
    getTrendingSongs: (limit?: number) => Promise<Song[]>;
    searchSongs: (query: string) => Promise<Song[]>;
    getSuggestions: (query: string) => Promise<{
        title: string;
        artist: string;
    }[]>;
    getStreamUrl: (songId: string) => Promise<string>;
    getSongDetails: (songId: string) => Promise<Song>;
    setAuthToken: (token: string | null) => void;
    login: (email: string, password: string) => Promise<any>;
    register: (email: string, password: string, username: string) => Promise<any>;
    getUserPlaylists: () => Promise<any>;
    getPlaylistById: (playlistId: string) => Promise<any>;
    createPlaylist: (name: string, description?: string) => Promise<any>;
    updatePlaylist: (playlistId: string, data: {
        name?: string;
        description?: string;
        coverImage?: string;
        isPublic?: boolean;
    }) => Promise<any>;
    deletePlaylist: (playlistId: string) => Promise<any>;
    addSongToPlaylist: (playlistId: string, songId: string) => Promise<any>;
    removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<any>;
    generateShareLink: (playlistId: string) => Promise<any>;
};
//# sourceMappingURL=apiClient.d.ts.map
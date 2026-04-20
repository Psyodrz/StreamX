"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamXAPI = void 0;
const axios_1 = __importDefault(require("axios"));
// Determine the base URL based on environment variables exposed by Next.js or Expo
// To handle React Native physical device testing, you may need to map localhost to your active local IP on your network.
const API_URL = process.env.NEXT_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    'http://localhost:3001/api/v1';
const apiClient = axios_1.default.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});
exports.StreamXAPI = {
    // Search and Discovery
    getTrendingSongs: async (limit) => {
        const response = await apiClient.get('/search/trending', {
            params: limit ? { limit } : undefined,
        });
        return response.data.data;
    },
    searchSongs: async (query) => {
        const response = await apiClient.get(`/search`, { params: { q: query } });
        return response.data.data;
    },
    getSuggestions: async (query) => {
        const response = await apiClient.get(`/search/suggest`, { params: { q: query } });
        return response.data.data;
    },
    // Streaming
    getStreamUrl: async (songId) => {
        // Expected to return the signed URL for Howler / TrackPlayer to consume dynamically
        const response = await apiClient.get(`/songs/${songId}/stream`);
        return response.data.streamUrl;
    },
    // Library / Songs
    getSongDetails: async (songId) => {
        const response = await apiClient.get(`/songs/${songId}`);
        return response.data.data;
    },
    // Auth
    setAuthToken: (token) => {
        if (token) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        else {
            delete apiClient.defaults.headers.common['Authorization'];
        }
    },
    login: async (email, password) => {
        const response = await apiClient.post('/auth/login', { email, password });
        return response.data;
    },
    register: async (email, password, username) => {
        const response = await apiClient.post('/auth/register', { email, password, username });
        return response.data;
    },
    // Playlists
    getUserPlaylists: async () => {
        const response = await apiClient.get('/playlists');
        return response.data.data;
    },
    getPlaylistById: async (playlistId) => {
        const response = await apiClient.get(`/playlists/${playlistId}`);
        return response.data.data;
    },
    createPlaylist: async (name, description) => {
        const response = await apiClient.post('/playlists', { name, description });
        return response.data.data;
    },
    updatePlaylist: async (playlistId, data) => {
        const response = await apiClient.patch(`/playlists/${playlistId}`, data);
        return response.data.data;
    },
    deletePlaylist: async (playlistId) => {
        const response = await apiClient.delete(`/playlists/${playlistId}`);
        return response.data.data;
    },
    addSongToPlaylist: async (playlistId, songId) => {
        const response = await apiClient.post(`/playlists/${playlistId}/songs`, { songId });
        return response.data.data;
    },
    removeSongFromPlaylist: async (playlistId, songId) => {
        const response = await apiClient.delete(`/playlists/${playlistId}/songs/${songId}`);
        return response.data.data;
    },
    generateShareLink: async (playlistId) => {
        const response = await apiClient.post(`/playlists/${playlistId}/share`);
        return response.data.data;
    }
};
//# sourceMappingURL=apiClient.js.map
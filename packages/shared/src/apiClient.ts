import axios from 'axios';
import { Song, SongListResponse, SongResponse, SearchResponse } from './index';

// Determine the base URL based on environment variables exposed by Next.js or Expo
// To handle React Native physical device testing, you may need to map localhost to your active local IP on your network.
const API_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  process.env.EXPO_PUBLIC_API_URL || 
  'http://localhost:3001/api/v1'; 

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const StreamXAPI = {
  // Search and Discovery
  getTrendingSongs: async (limit?: number): Promise<Song[]> => {
    const response = await apiClient.get<SongListResponse>('/search/trending', {
      params: limit ? { limit } : undefined,
    });
    return response.data.data;
  },

  searchSongs: async (query: string): Promise<Song[]> => {
    const response = await apiClient.get<SongListResponse>(`/search`, { params: { q: query } });
    return response.data.data;
  },

  getSuggestions: async (query: string): Promise<{ title: string; artist: string }[]> => {
    const response = await apiClient.get<{ success: boolean; data: { title: string; artist: string }[] }>(`/search/suggest`, { params: { q: query } });
    return response.data.data;
  },

  // Streaming
  getStreamUrl: async (songId: string): Promise<string> => {
    // Expected to return the signed URL for Howler / TrackPlayer to consume dynamically
    const response = await apiClient.get<{ success: boolean; streamUrl: string; source: string }>(`/songs/${songId}/stream`);
    return response.data.streamUrl;
  },
  
  // Library / Songs
  getSongDetails: async (songId: string): Promise<Song> => {
    const response = await apiClient.get<SongResponse>(`/songs/${songId}`);
    return response.data.data;
  },

  // Auth
  setAuthToken: (token: string | null) => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  },

  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email: string, password: string, username: string) => {
    const response = await apiClient.post('/auth/register', { email, password, username });
    return response.data;
  },

  // Playlists
  getUserPlaylists: async () => {
    const response = await apiClient.get('/playlists');
    return response.data.data;
  },

  getPlaylistById: async (playlistId: string) => {
    const response = await apiClient.get(`/playlists/${playlistId}`);
    return response.data.data;
  },

  createPlaylist: async (name: string, description?: string) => {
    const response = await apiClient.post('/playlists', { name, description });
    return response.data.data;
  },

  updatePlaylist: async (playlistId: string, data: { name?: string; description?: string; coverImage?: string; isPublic?: boolean }) => {
    const response = await apiClient.patch(`/playlists/${playlistId}`, data);
    return response.data.data;
  },

  deletePlaylist: async (playlistId: string) => {
    const response = await apiClient.delete(`/playlists/${playlistId}`);
    return response.data.data;
  },

  addSongToPlaylist: async (playlistId: string, songId: string) => {
    const response = await apiClient.post(`/playlists/${playlistId}/songs`, { songId });
    return response.data.data;
  },

  removeSongFromPlaylist: async (playlistId: string, songId: string) => {
    const response = await apiClient.delete(`/playlists/${playlistId}/songs/${songId}`);
    return response.data.data;
  },

  generateShareLink: async (playlistId: string) => {
    const response = await apiClient.post(`/playlists/${playlistId}/share`);
    return response.data.data;
  },

  // AI Smart Shuffle & Playlists
  smartShuffle: async (history: { title: string; artist: string }[], count: number = 5) => {
    const response = await apiClient.post('/ai/smart-shuffle', { history, count });
    return response.data.data;
  },

  getAIDiscoveryPlaylists: async () => {
    const response = await apiClient.get('/ai/playlists/discovery');
    return response.data.data;
  },

  getAIPersonalizedPlaylists: async (history: { title: string; artist: string }[]) => {
    const response = await apiClient.post('/ai/playlists/personalized', { history });
    return response.data.data;
  },

  getAIPlaylistById: async (id: string) => {
    const response = await apiClient.get(`/ai/playlists/${id}`);
    return response.data.data;
  },

  hydrateAITracks: async (tracks: { title: string; artist: string }[]) => {
    const response = await apiClient.post('/ai/playlists/hydrate', { tracks });
    return response.data.data;
  },
};

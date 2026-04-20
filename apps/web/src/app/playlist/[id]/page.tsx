'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Play, Pause, MoreVertical, Plus, Trash2, Share2, Edit2, X, Music } from 'lucide-react';
import { StreamXAPI, Song } from '@streamx/shared';
import { usePlayerStore } from '@streamx/store';
import { useAuthStore } from '../../../store/authStore';

interface Playlist {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  songs: Song[];
  isPublic: boolean;
}

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const play = usePlayerStore((state) => state.play);
  const pause = usePlayerStore((state) => state.pause);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTrack = usePlayerStore((state) => state.currentTrack);

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    const fetchPlaylist = async () => {
      setLoading(true);
      try {
        const data = await StreamXAPI.getPlaylistById(params.id as string);
        setPlaylist(data);
        setIsOwner(true); // For now, assume owner if authenticated
        setEditName(data.name);
        setEditDescription(data.description || '');
      } catch (err) {
        console.error('Failed to fetch playlist:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPlaylist();
    }
  }, [params.id]);

  const handlePlay = (song: Song) => {
    if (currentTrack?.id === song._id && isPlaying) {
      pause();
    } else {
      play({
        id: song._id,
        title: song.title,
        artist: song.artist,
        artwork: song.albumArt || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400',
        duration: song.duration,
      });
    }
  };

  const handleRemoveSong = async (songId: string) => {
    try {
      await StreamXAPI.removeSongFromPlaylist(playlist!._id, songId);
      setPlaylist(prev => prev ? {
        ...prev,
        songs: prev.songs.filter(s => s._id !== songId)
      } : null);
      setShowMenu(null);
    } catch (err) {
      console.error('Failed to remove song:', err);
    }
  };

  const handleUpdatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await StreamXAPI.updatePlaylist(playlist!._id, {
        name: editName,
        description: editDescription
      });
      setPlaylist(updated);
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update playlist:', err);
    }
  };

  const handleShare = async () => {
    try {
      const { shareToken, url } = await StreamXAPI.generateShareLink(playlist!._id);
      const shareUrl = `${window.location.origin}${url}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (err) {
      console.error('Failed to generate share link:', err);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await StreamXAPI.deletePlaylist(playlist!._id);
      router.push('/library');
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="flex flex-col md:flex-row gap-8 mb-10">
            <div className="w-52 h-52 bg-white/5 rounded-xl" />
            <div className="flex-1 space-y-4">
              <div className="h-4 bg-white/5 rounded w-24" />
              <div className="h-10 bg-white/5 rounded w-3/4" />
              <div className="h-4 bg-white/5 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto text-center py-20">
        <div className="text-white/40 text-xl">Playlist not found</div>
      </div>
    );
  }

  const totalDuration = playlist.songs.reduce((acc, song) => acc + (song.duration || 0), 0);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto">
      {/* Playlist Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        {/* Cover Art */}
        <div className="w-52 h-52 rounded-xl bg-gradient-to-br from-amethyst/40 to-coral/40 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-2xl shadow-amethyst/10">
          {playlist.coverImage ? (
            <img src={playlist.coverImage} alt={playlist.name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <div className="text-center p-6">
              <Music size={40} className="text-white/20 mx-auto" />
              <div className="text-white/40 text-sm mt-2">{playlist.songs.length} songs</div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-end">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Playlist</span>
          <h1 className="text-4xl md:text-5xl font-black text-white mt-2 mb-4">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-white/60 text-sm md:text-base mb-4">{playlist.description}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-white/40">
            <span>{playlist.songs.length} songs</span>
            <span>•</span>
            <span>{formatTime(totalDuration)}</span>
            {playlist.isPublic && (
              <>
                <span>•</span>
                <span className="text-amethyst-light">Public</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        {isOwner && (
          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={handleShare}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={handleDeletePlaylist}
              className="p-3 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Songs List */}
      {playlist.songs.length > 0 ? (
        <div className="flex flex-col gap-2">
          {playlist.songs.map((song, index) => {
            const isCurrentTrack = currentTrack?.id === song._id;

            return (
              <div
                key={song._id}
                className={`group flex items-center gap-4 p-3 rounded-xl hover:bg-white/10 transition-colors ${
                  isCurrentTrack ? 'bg-white/5' : ''
                }`}
              >
                {/* Track Number / Play Icon */}
                <div className="w-8 text-center text-white/30 text-sm group-hover:hidden">
                  {isCurrentTrack && isPlaying ? (
                    <div className="flex items-center justify-center gap-0.5">
                      <span className="w-1 h-3 bg-amethyst animate-pulse rounded-full" />
                      <span className="w-1 h-4 bg-amethyst animate-pulse delay-75 rounded-full" />
                      <span className="w-1 h-2 bg-amethyst animate-pulse delay-150 rounded-full" />
                    </div>
                  ) : (
                    index + 1
                  )}
                </div>
                <button
                  onClick={() => handlePlay(song)}
                  className="w-8 hidden group-hover:flex items-center justify-center text-white"
                >
                  {isCurrentTrack && isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>

                {/* Album Art */}
                <img
                  src={song.albumArt || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400'}
                  alt={song.title}
                  className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                />

                {/* Title & Artist */}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${isCurrentTrack ? 'text-amethyst-light' : 'text-white'}`}>
                    {song.title}
                  </div>
                  <div className="text-sm text-white/40 truncate">{song.artist}</div>
                </div>

                {/* Duration */}
                <div className="text-sm text-white/30 hidden md:block">
                  {song.duration && formatTime(song.duration)}
                </div>

                {/* More Menu */}
                {isOwner && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(showMenu === song._id ? null : song._id)}
                      className="p-2 text-white/30 hover:text-white transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {showMenu === song._id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowMenu(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 glass rounded-xl border border-white/10 py-2 z-50 shadow-xl">
                          <button
                            onClick={() => handleRemoveSong(song._id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-3"
                          >
                            <Trash2 size={16} />
                            Remove from playlist
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 glass rounded-2xl border border-white/5">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Plus size={40} className="text-white/30" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No songs yet</h3>
          <p className="text-white/40 mb-6">Add songs to get started</p>
          <button
            onClick={() => router.push('/search')}
            className="px-6 py-3 bg-amethyst hover:bg-amethyst-light text-white font-semibold rounded-xl transition-colors"
          >
            Browse Music
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass-card max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Edit playlist</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdatePlaylist} className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-white/70 font-medium ml-1">Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-2 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amethyst"
                  placeholder="My Awesome Playlist"
                />
              </div>
              <div>
                <label className="text-sm text-white/70 font-medium ml-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full mt-2 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amethyst resize-none"
                  placeholder="Add a description..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-white/70 hover:bg-white/10 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editName.trim()}
                  className="px-6 py-2 rounded-xl bg-amethyst hover:bg-amethyst-light text-white font-bold transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

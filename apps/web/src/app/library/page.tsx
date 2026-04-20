'use client';

import { useState, useEffect } from 'react';
import { StreamXAPI, Song } from '@streamx/shared';
import { useAuthStore } from '../../store/authStore';
import { usePlayerStore } from '@streamx/store';
import { Plus, ListMusic, Play, MoreVertical, Clock } from 'lucide-react';
import Link from 'next/link';

interface Playlist {
  _id: string;
  name: string;
  description: string;
  songs: Song[];
}

export default function LibraryPage({ searchParams }: { searchParams: { genre?: string } }) {
  const { user, isAuthenticated } = useAuthStore();
  const play = usePlayerStore((state) => state.play);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  
  // If search param 'genre' is present, we could fetch genre specific songs here
  const genre = searchParams?.genre;
  const [genreSongs, setGenreSongs] = useState<Song[]>([]);

  useEffect(() => {
    const fetchLibraryData = async () => {
      setLoading(true);
      try {
        if (genre) {
           // Basic fuzzy search for the genre for now
           const songs = await StreamXAPI.searchSongs(genre);
           setGenreSongs(songs);
        } else if (isAuthenticated) {
          const userPlaylists = await StreamXAPI.getUserPlaylists();
          setPlaylists(userPlaylists);
        }
      } catch (err) {
        console.error('Failed to load library data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLibraryData();
  }, [genre, isAuthenticated]);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const newPlaylist = await StreamXAPI.createPlaylist(newPlaylistName, newPlaylistDescription);
      setPlaylists([...playlists, newPlaylist]);
      setShowCreateModal(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
    } catch (err) {
      console.error('Failed to create playlist', err);
    }
  };

  const handlePlay = (song: Song) => {
    play({
      id: song._id,
      title: song.title,
      artist: song.artist,
      artwork: song.albumArt || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400',
      duration: song.duration,
    });
  };

  if (genre) {
    return (
      <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto flex flex-col gap-10">
        <header className="mb-6">
           <h1 className="text-4xl font-bold capitalize text-white mb-2">{genre} Music</h1>
           <p className="text-muted">Explore the top tracks in this genre.</p>
        </header>

        {loading ? (
             <p className="text-muted">Loading...</p>
        ) : genreSongs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {genreSongs.map((song) => (
                <div 
                   key={song._id} 
                   className="glass p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-colors group"
                   onClick={() => handlePlay(song)}
                >
                  <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                    <img src={song.albumArt || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400'} alt={song.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play fill="currentColor" size={20} className="ml-1 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col flex-grow min-w-0">
                    <h4 className="font-semibold text-lg truncate text-white">{song.title}</h4>
                    <p className="text-sm text-muted">{song.artist}</p>
                  </div>
                </div>
              ))}
          </div>
        ) : (
             <p className="text-muted">No songs found for this genre yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto flex flex-col gap-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Your Library</h1>
          <p className="text-muted">All your playlists in one place.</p>
        </div>
        
        {isAuthenticated && (
          <button 
             onClick={() => setShowCreateModal(true)}
             className="bg-transparent hover:bg-white/10 border border-white/20 text-white flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            Create Playlist
          </button>
        )}
      </header>

      {!isAuthenticated ? (
        <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center gap-6">
           <div className="w-16 h-16 rounded-full bg-amethyst/20 flex items-center justify-center text-amethyst-light mb-2">
             <ListMusic size={32} />
           </div>
           <div>
             <h2 className="text-2xl font-bold text-white mb-2">Sign in to view your library</h2>
             <p className="text-muted max-w-md mx-auto">Create playlists, save your favorite tracks, and sync everything across your devices.</p>
           </div>
           <Link href="/login" className="bg-amethyst text-white font-bold px-8 py-3 rounded-xl hover:scale-105 transition-transform mt-2">
             Sign In
           </Link>
        </div>
      ) : (
        <section>
           {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[...Array(4)].map((_, i) => <div key={i} className="h-48 glass rounded-xl animate-pulse" />)}
             </div>
           ) : playlists.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {playlists.map((pl) => {
                  const totalDuration = pl.songs?.reduce((acc: number, song: Song) => acc + (song.duration || 0), 0) || 0;
                  const formatTime = (seconds: number) => {
                    const mins = Math.floor(seconds / 60);
                    const secs = Math.floor(seconds % 60);
                    return `${mins}:${secs.toString().padStart(2, '0')}`;
                  };

                  return (
                    <Link key={pl._id} href={`/playlist/${pl._id}`} className="glass p-6 rounded-xl hover:bg-white/10 transition-colors group flex flex-col gap-4 h-full border border-white/5 hover:border-white/10">
                       <div className="w-16 h-16 rounded-lg bg-gradient-to-tr from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-white/50 group-hover:text-white group-hover:from-purple-500/40 group-hover:to-blue-500/40 transition-all">
                         <ListMusic size={28} />
                       </div>
                       <div className="flex-1 min-w-0">
                         <h3 className="font-bold text-lg text-white mb-1 truncate">{pl.name}</h3>
                         {pl.description && (
                           <p className="text-xs text-white/40 line-clamp-2 mb-2">{pl.description}</p>
                         )}
                         <div className="flex items-center gap-2 text-xs text-white/30">
                           <span>{pl.songs?.length || 0} tracks</span>
                           <span>•</span>
                           <span className="flex items-center gap-1">
                             <Clock size={10} />
                             {formatTime(totalDuration)}
                           </span>
                         </div>
                       </div>
                    </Link>
                  );
                })}
             </div>
           ) : (
             <div className="text-center py-20">
               <p className="text-muted">You haven't created any playlists yet.</p>
             </div>
           )}
        </section>
      )}

      {/* Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
           <div className="glass-card max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
             <h2 className="text-2xl font-bold text-white mb-6">Create new playlist</h2>
             <form onSubmit={handleCreatePlaylist} className="flex flex-col gap-4">
               <div>
                  <label className="text-sm text-white/70 font-medium ml-1">Name</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full mt-2 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amethyst"
                    placeholder="My Awesome Playlist"
                  />
               </div>
               <div>
                  <label className="text-sm text-white/70 font-medium ml-1">Description (optional)</label>
                  <textarea
                    value={newPlaylistDescription}
                    onChange={(e) => setNewPlaylistDescription(e.target.value)}
                    className="w-full mt-2 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amethyst resize-none"
                    placeholder="Describe your playlist..."
                    rows={3}
                  />
               </div>
               <div className="flex gap-3 justify-end mt-4">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl text-white/70 hover:bg-white/10 transition-colors font-medium">Cancel</button>
                  <button type="submit" disabled={!newPlaylistName.trim()} className="px-6 py-2 rounded-xl bg-amethyst hover:bg-amethyst-light text-white font-bold transition-colors disabled:opacity-50">Create</button>
               </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}

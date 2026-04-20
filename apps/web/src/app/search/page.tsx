'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { Search as SearchIcon, Play, Pause, Music, Mic2, Film, Video, Users, MoreVertical, Plus, Library, X } from 'lucide-react';
import { StreamXAPI, Song } from '@streamx/shared';
import { usePlayerStore } from '@streamx/store';
import { useAuthStore } from '../../store/authStore';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Extended song type with sourceType from backend
interface ClassifiedSong extends Song {
  sourceType?: string;
  sourceTypeLabel?: string;
}

// Icons and colors for each source type tier
const TIER_CONFIG: Record<string, { icon: typeof Music; color: string; bg: string }> = {
  'OFFICIAL_AUDIO': { icon: Music,  color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  'LYRIC':          { icon: Mic2,   color: 'text-sky-400',     bg: 'bg-sky-400/10 border-sky-400/20' },
  'FILM_VERSION':   { icon: Film,   color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/20' },
  'FULL_VIDEO':     { icon: Video,  color: 'text-purple-400',  bg: 'bg-purple-400/10 border-purple-400/20' },
  'COVER':          { icon: Users,  color: 'text-white/40',    bg: 'bg-white/5 border-white/10' },
};

interface Playlist {
  _id: string;
  name: string;
}

function SearchPageContent() {
  const play = usePlayerStore((state) => state.play);
  const pause = usePlayerStore((state) => state.pause);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const { isAuthenticated } = useAuthStore();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(urlQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery);
  const [results, setResults] = useState<ClassifiedSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<string | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);

  // Sync URL query param changes (from header search)
  useEffect(() => {
    if (urlQuery) {
      setQuery(urlQuery);
      setDebouncedQuery(urlQuery);
    }
  }, [urlQuery]);

  // Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(handler);
  }, [query]);

  // Execute search
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const songs = await StreamXAPI.searchSongs(debouncedQuery);
        setResults(songs as ClassifiedSong[]);
      } catch (error) {
        console.error('Failed to perform search:', error);
      } finally {
        setLoading(false);
      }
    };
    performSearch();
  }, [debouncedQuery]);

  // Group results by sourceType
  const groupedResults = useMemo(() => {
    const groups: Record<string, ClassifiedSong[]> = {};
    const tierOrder = ['OFFICIAL_AUDIO', 'LYRIC', 'FILM_VERSION', 'FULL_VIDEO', 'COVER'];

    for (const song of results) {
      const key = song.sourceType || 'COVER';
      if (!groups[key]) groups[key] = [];
      groups[key].push(song);
    }

    // Return ordered groups
    return tierOrder
      .filter(tier => groups[tier] && groups[tier].length > 0)
      .map(tier => ({
        tier,
        label: groups[tier][0]?.sourceTypeLabel || tier,
        songs: groups[tier],
      }));
  }, [results]);

  const handlePlay = (song: ClassifiedSong) => {
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

  const handleAddToPlaylist = async (playlistId: string, songId: string) => {
    try {
      await StreamXAPI.addSongToPlaylist(playlistId, songId);
      setShowAddToPlaylist(null);
    } catch (err) {
      console.error('Failed to add to playlist:', err);
    }
  };

  const openAddToPlaylist = async (songId: string) => {
    if (!isAuthenticated) {
      alert('Please sign in to add songs to playlists');
      return;
    }
    try {
      const playlists = await StreamXAPI.getUserPlaylists();
      setUserPlaylists(playlists);
      setShowAddToPlaylist(songId);
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
    }
  };

  return (
    <div className="pt-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col gap-8">
      
      <h1 className="text-2xl font-bold tracking-tight text-white/90">
        {debouncedQuery ? `Results for "${debouncedQuery}"` : 'Search'}
      </h1>

      {/* Results View */}
      <section>
        {loading ? (
          <div className="flex flex-col gap-6">
            {[...Array(3)].map((_, gi) => (
              <div key={gi}>
                <div className="h-4 bg-white/5 rounded w-40 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="glass p-4 rounded-xl flex items-center gap-4 animate-pulse">
                      <div className="w-14 h-14 bg-white/5 rounded-md" />
                      <div className="flex flex-col gap-2 flex-grow">
                        <div className="h-4 bg-white/5 w-3/4 rounded" />
                        <div className="h-3 bg-white/5 w-1/2 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        ) : groupedResults.length > 0 ? (
          <div className="flex flex-col gap-8">
            {groupedResults.map(({ tier, label, songs }) => {
              const config = TIER_CONFIG[tier] || TIER_CONFIG['COVER'];
              const TierIcon = config.icon;

              return (
                <div key={tier}>
                  {/* Tier Section Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide ${config.bg} ${config.color}`}>
                      <TierIcon size={14} />
                      <span>{label}</span>
                    </div>
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-xs text-white/20">{songs.length} result{songs.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Song Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {songs.map((song) => {
                      const isCurrentTrack = currentTrack?.id === song._id;
                      return (
                        <div
                          key={song._id}
                          className={`glass p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-all group hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(124,58,237,0.12)] ${
                            isCurrentTrack ? 'bg-white/5 ring-1 ring-amethyst/30' : ''
                          }`}
                          onClick={() => handlePlay(song)}
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handlePlay(song)}
                        >
                          <div className="relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0 shadow-md">
                            <img
                              src={song.albumArt || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400'}
                              alt={song.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-amethyst rounded-full p-1.5 transform scale-75 group-hover:scale-100 transition-transform">
                                {isCurrentTrack && isPlaying ? (
                                  <Pause fill="currentColor" size={14} className="text-white" />
                                ) : (
                                  <Play fill="currentColor" size={14} className="text-white ml-0.5" />
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col flex-grow min-w-0">
                            <h4 className={`font-semibold truncate text-sm ${isCurrentTrack ? 'text-amethyst-light' : 'text-white'}`}>{song.title}</h4>
                            <p className="text-xs text-white/40 truncate">{song.artist}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="flex-shrink-0 text-xs text-white/20 hidden md:block">
                              {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); openAddToPlaylist(song._id); }}
                              className="p-1.5 text-white/30 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                              title="Add to playlist"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        ) : debouncedQuery.trim() !== '' ? (
          <div className="text-center py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20">
              <SearchIcon size={32} />
            </div>
            <div>
              <p className="text-xl font-medium text-white/60">No results found for &quot;{debouncedQuery}&quot;</p>
              <p className="text-sm text-white/30 mt-2">Try different keywords or check your spelling.</p>
            </div>
          </div>
        ) : (
          <div className="py-10">
            <h2 className="text-lg font-bold mb-6 text-white/80">Browse all</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {['Pop', 'Hip-Hop', 'Electronic', 'Rock', 'R&B', 'Classical', 'Jazz', 'Bollywood'].map((genre, i) => {
                const colors = [
                  'from-purple-500 to-pink-500',
                  'from-blue-500 to-teal-400',
                  'from-orange-500 to-red-500',
                  'from-green-400 to-blue-500',
                  'from-indigo-500 to-purple-600',
                  'from-pink-500 to-rose-500',
                  'from-teal-400 to-emerald-500',
                  'from-yellow-500 to-orange-500'
                ];
                return (
                  <Link href={`/search?q=${encodeURIComponent(genre + ' songs')}`} key={genre}>
                    <div className={`h-36 rounded-xl bg-gradient-to-br ${colors[i % colors.length]} p-4 relative overflow-hidden group cursor-pointer shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`}>
                      <span className="font-bold text-lg text-white drop-shadow-md z-10 relative">{genre}</span>
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* Add to Playlist Modal */}
      {showAddToPlaylist && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass-card max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add to playlist</h2>
              <button
                onClick={() => setShowAddToPlaylist(null)}
                className="p-2 text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            {userPlaylists.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                {userPlaylists.map((pl) => (
                  <button
                    key={pl._id}
                    onClick={() => handleAddToPlaylist(pl._id, showAddToPlaylist)}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-white/50">
                      <Library size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{pl.name}</div>
                    </div>
                    <Plus size={18} className="text-white/40" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Library size={24} className="text-white/30" />
                </div>
                <p className="text-white/60 mb-4">No playlists yet</p>
                <Link
                  href="/library"
                  onClick={() => setShowAddToPlaylist(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amethyst hover:bg-amethyst-light text-white font-medium rounded-xl transition-colors"
                >
                  <Plus size={16} />
                  Create playlist
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="pt-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="animate-pulse flex flex-col gap-6">
          <div className="h-8 bg-white/5 rounded w-60" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass p-4 rounded-xl flex items-center gap-4">
                <div className="w-14 h-14 bg-white/5 rounded-md" />
                <div className="flex flex-col gap-2 flex-grow">
                  <div className="h-4 bg-white/5 w-3/4 rounded" />
                  <div className="h-3 bg-white/5 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}

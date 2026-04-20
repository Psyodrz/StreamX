'use client';

import { Play, Loader2, Sparkles, Music, Mic2, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePlayerStore } from '@streamx/store';
import { StreamXAPI, Song } from '@streamx/shared';
import Link from 'next/link';

// Use same interface from the backend
interface AIPlaylistTrack {
  _id?: string;
  youtubeVideoId?: string;
  title: string;
  artist: string;
  albumArt?: string;
  duration?: number;
  unhydrated?: boolean;
}

interface AIPlaylist {
  id: string;
  name: string;
  description: string;
  coverQuery: string;
  songs: AIPlaylistTrack[];
  type: 'mood' | 'artist' | 'era' | 'personalized' | 'trending';
}

// Horizontal scrolling container component
const ScrollShelf = ({ title, children, icon }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) => (
  <section className="flex flex-col gap-3">
    <div className="flex items-center gap-3 px-4 md:px-8">
      {icon && <div className="text-amethyst">{icon}</div>}
      <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
    </div>
    <div className="flex overflow-x-auto gap-4 px-4 md:px-8 pb-4 scrollbar-hide snap-x snap-mandatory">
      {children}
    </div>
  </section>
);

export default function Home() {
  const play = usePlayerStore((state) => state.play);
  const listeningHistory = usePlayerStore((state) => state.listeningHistory);
  
  const [discoveryPlaylists, setDiscoveryPlaylists] = useState<AIPlaylist[]>([]);
  const [personalizedPlaylists, setPersonalizedPlaylists] = useState<AIPlaylist[]>([]);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(true);
  const [isLoadingPersonalized, setIsLoadingPersonalized] = useState(false);

  useEffect(() => {
    const fetchDiscovery = async () => {
      try {
        const playlists = await StreamXAPI.getAIDiscoveryPlaylists();
        setDiscoveryPlaylists(playlists);
      } catch (err) {
        console.error('Failed to fetch discovery playlists:', err);
      } finally {
        setIsLoadingDiscovery(false);
      }
    };
    fetchDiscovery();
  }, []);

  useEffect(() => {
    if (listeningHistory.length < 3) return;
    const fetchPersonalized = async () => {
      setIsLoadingPersonalized(true);
      try {
        const historyData = listeningHistory.map(t => ({ title: t.title, artist: t.artist })).slice(-10);
        const playlists = await StreamXAPI.getAIPersonalizedPlaylists(historyData);
        setPersonalizedPlaylists(playlists);
      } catch (err) {
        console.error('Failed to fetch personalized playlists:', err);
      } finally {
        setIsLoadingPersonalized(false);
      }
    };
    fetchPersonalized();
  }, [listeningHistory.length]);

  const chips = ['Podcasts', 'Romance', 'Feel good', 'Workout', 'Party', 'Focus', 'Sad', 'Sleep'];

  // Categorize discovery playlists
  const moodPlaylists = discoveryPlaylists.filter(p => p.type === 'mood');
  const artistPlaylists = discoveryPlaylists.filter(p => p.type === 'artist');
  const eraPlaylists = discoveryPlaylists.filter(p => p.type === 'era');
  const trendingPlaylists = discoveryPlaylists.filter(p => p.type === 'trending');

  return (
    <div className="flex flex-col gap-10 px-0 pb-10">
      
      {/* Top Chips */}
      <div className="flex overflow-x-auto gap-3 px-4 md:px-8 pb-2 scrollbar-hide pt-4 md:pt-6">
        {chips.map((chip) => (
          <Link 
            key={chip}
            href={`/search?q=${encodeURIComponent(chip)}`}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/5 text-sm font-medium text-white transition-colors whitespace-nowrap"
          >
            {chip}
          </Link>
        ))}
      </div>

      {isLoadingDiscovery ? (
        <div className="animate-pulse flex flex-col gap-12 px-4 md:px-8">
           <div className="flex items-center gap-3">
             <div className="h-6 w-6 bg-white/10 rounded-full" />
             <div className="h-6 w-48 bg-white/10 rounded" />
             <div className="text-amethyst-light flex items-center gap-2 text-xs ml-auto">
               <Loader2 size={14} className="animate-spin" />
               Assembling your playlists...
             </div>
           </div>
           <div className="flex gap-4">
             <div className="h-56 w-48 bg-white/5 rounded-xl shrink-0" />
             <div className="h-56 w-48 bg-white/5 rounded-xl shrink-0" />
             <div className="h-56 w-48 bg-white/5 rounded-xl shrink-0" />
           </div>
        </div>
      ) : (
        <>
          {/* Personalized Section */}
          {(personalizedPlaylists.length > 0 || isLoadingPersonalized) && (
            <ScrollShelf title="Made for You" icon={<Sparkles size={24} />}>
              {isLoadingPersonalized ? (
                <div className="animate-pulse flex gap-4">
                  <div className="h-56 w-48 bg-white/5 rounded-xl shrink-0" />
                  <div className="h-56 w-48 bg-white/5 rounded-xl shrink-0" />
                </div>
              ) : (
                personalizedPlaylists.map(playlist => (
                  <PlaylistCard key={playlist.id} playlist={playlist} />
                ))
              )}
            </ScrollShelf>
          )}

          {/* Trending Global */}
          {trendingPlaylists.length > 0 && (
            <ScrollShelf title="Trending Now" icon={<Sparkles size={24} className="text-coral" />}>
              {trendingPlaylists.map(playlist => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </ScrollShelf>
          )}

          {/* Mood Playlists */}
          {moodPlaylists.length > 0 && (
            <ScrollShelf title="Mood & Flow" icon={<Music size={24} />}>
              {moodPlaylists.map(playlist => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </ScrollShelf>
          )}

          {/* Artist Playlists */}
          {artistPlaylists.length > 0 && (
            <ScrollShelf title="Artist Spotlights" icon={<Mic2 size={24} />}>
              {artistPlaylists.map(playlist => (
                <PlaylistCard key={playlist.id} playlist={playlist} variant="artist" />
              ))}
            </ScrollShelf>
          )}

          {/* Era Playlists */}
          {eraPlaylists.length > 0 && (
            <ScrollShelf title="Decades & Eras" icon={<Calendar size={24} />}>
              {eraPlaylists.map(playlist => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </ScrollShelf>
          )}

          {/* Empty State / API Rate Limit Fallback */}
          {discoveryPlaylists.length === 0 && (
             <div className="flex flex-col items-center justify-center text-center px-4 py-20 mt-10 w-full glass mx-auto max-w-3xl rounded-3xl border border-white/5">
                <Sparkles size={48} className="text-white/20 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Taking a breather!</h3>
                <p className="text-white/50 max-w-md">We are currently assembling too many playlists and hit a temporary rate limit. Please wait about a minute and refresh the page to get your fresh tracks.</p>
             </div>
          )}
        </>
      )}

    </div>
  );
}

// Reusable component for AI Playlists
function PlaylistCard({ playlist, variant = 'default' }: { playlist: AIPlaylist, variant?: 'default' | 'artist' }) {
  const routerUrl = `/ai-playlist/${playlist.id}`;

  if (variant === 'artist') {
    return (
      <Link href={routerUrl} className="group flex flex-col items-center gap-3 w-36 md:w-44 shrink-0 snap-start text-center cursor-pointer">
        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden glass hover:shadow-xl hover:shadow-amethyst/10 transition-all">
          {playlist.coverQuery ? (
            <img src={playlist.coverQuery} alt={playlist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
             <div className="w-full h-full bg-gradient-to-br from-amethyst/30 to-coral/30 flex items-center justify-center">
               <Music size={32} className="text-white/50" />
             </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-coral text-white rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform shadow-lg">
              <Play fill="currentColor" size={24} className="ml-1" />
            </div>
          </div>
        </div>
        <div className="flex flex-col px-1 w-full">
          <h4 className="font-bold text-white text-sm truncate">{playlist.name}</h4>
          <p className="text-xs text-white/50 mt-0.5 truncate">{playlist.songs.length} Tracks</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={routerUrl} className="group flex flex-col gap-2 w-40 md:w-52 shrink-0 snap-start cursor-pointer">
      <div className="relative w-full aspect-square rounded-xl overflow-hidden glass hover:shadow-lg hover:shadow-amethyst/10 transition-all">
        {playlist.coverQuery ? (
          <img src={playlist.coverQuery} alt={playlist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amethyst/30 to-coral/30 flex items-center justify-center">
            <Music size={48} className="text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-amethyst text-white rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform shadow-lg">
            <Play fill="currentColor" size={24} className="ml-1" />
          </div>
        </div>
        
        {/* Track count pill */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-medium text-white border border-white/10">
          {playlist.songs.length} Tracks
        </div>
        <div className="absolute bottom-2 left-2 right-2 bg-black/80 px-2 py-1.5 rounded-lg text-[10px] font-medium text-white/80 backdrop-blur-sm truncate border border-white/10">
          {playlist.description}
        </div>
      </div>
      <div className="flex flex-col px-1 mt-1">
        <h4 className="font-bold text-white text-sm md:text-base leading-tight truncate">{playlist.name}</h4>
        <p className="text-xs text-white/50 mt-1 truncate">Curated for you</p>
      </div>
    </Link>
  );
}

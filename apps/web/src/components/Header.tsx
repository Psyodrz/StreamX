'use client';

import { Search, Menu, User } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchExpanded(false);
    }
  }, [query, router]);

  return (
    <header className="fixed top-0 left-0 md:left-72 right-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center gap-3 px-4 md:px-6 h-14">
        
        {/* Mobile: Hamburger */}
        <button 
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70"
        >
          <Menu size={22} />
        </button>

        {/* Mobile: Logo (only visible on mobile when search isn't expanded) */}
        {!searchExpanded && (
          <div className="md:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amethyst to-coral flex items-center justify-center">
              <span className="font-black text-white text-[8px]">SX</span>
            </div>
            <span className="font-bold text-base text-white">StreamX</span>
          </div>
        )}

        {/* Search bar — always visible on desktop, expandable on mobile */}
        <form 
          onSubmit={handleSearch} 
          className={`transition-all duration-300 ${
            searchExpanded 
              ? 'flex-1' 
              : 'hidden md:block md:flex-1 md:max-w-lg'
          }`}
        >
          <div className="relative group">
            <Search 
              size={16} 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-amethyst-light transition-colors" 
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => !query && setSearchExpanded(false)}
              autoFocus={searchExpanded}
              placeholder="Search songs, artists, albums..."
              className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amethyst/40 focus:bg-white/8 transition-all"
            />
          </div>
        </form>

        {/* Spacer pushes right items */}
        <div className="flex-1 md:hidden" />

        {/* Mobile: Search toggle */}
        {!searchExpanded && (
          <button 
            onClick={() => setSearchExpanded(true)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70"
          >
            <Search size={20} />
          </button>
        )}

        {/* Profile avatar */}
        <button className="w-8 h-8 rounded-full bg-gradient-to-br from-amethyst/60 to-coral/60 flex items-center justify-center text-white/80 hover:opacity-80 transition-opacity flex-shrink-0">
          <User size={16} />
        </button>
      </div>
    </header>
  );
}

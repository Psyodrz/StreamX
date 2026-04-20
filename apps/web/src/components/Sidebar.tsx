'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, X, Plus, Music2, Heart, Wind, Activity, Moon } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Explore', href: '/search', icon: Search },
    { name: 'Library', href: '/library', icon: Library },
  ];

  const quickPlaylists = [
    { name: 'Liked Music', icon: Heart },
    { name: 'Chill Vibes', icon: Wind },
    { name: 'Workout Mix', icon: Activity },
    { name: 'Late Night', icon: Moon },
  ];

  return (
    <>
      {/* ── Mobile Overlay ── */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* ── Sidebar Panel ── */}
      <aside 
        className={`
          fixed top-0 left-0 h-full z-50 w-72
          bg-[#0a0a0f] border-r border-white/5
          flex flex-col
          transition-transform duration-300 ease-in-out
          md:translate-x-0 md:z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* ── Top: Logo + Close (mobile) ── */}
        <div className="flex items-center justify-between p-5 pb-2">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amethyst to-coral flex items-center justify-center shadow-lg shadow-amethyst/20">
              <span className="font-black text-white text-[10px] tracking-wider">SX</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">StreamX</span>
          </Link>
          <button 
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/60"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="px-3 pt-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={22} className={isActive ? 'text-amethyst-light' : ''} />
                <span className="font-medium text-[15px]">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── Divider ── */}
        <div className="mx-5 my-4 h-px bg-white/5" />

        {/* ── New Playlist Button ── */}
        <div className="px-3">
          <button className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all text-sm font-medium">
            <Plus size={18} />
            <span>New playlist</span>
          </button>
        </div>

        {/* ── Playlists Section ── */}
        <div className="flex-1 overflow-y-auto mt-4 px-3 scrollbar-thin">
          {quickPlaylists.map((pl) => {
            const Icon = pl.icon;
            return (
              <Link
                key={pl.name}
                href="/library"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center text-lg flex-shrink-0 group-hover:bg-white/10 transition-colors">
                  <Icon size={18} className="text-white/60 group-hover:text-white transition-colors" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-white/80 truncate font-medium">{pl.name}</span>
                  <span className="text-[11px] text-white/30">Auto playlist</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Bottom Auth Section ── */}
        <div className="p-4 border-t border-white/5">
          <Link 
            href="/login"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl bg-amethyst/10 border border-amethyst/20 text-amethyst-light hover:bg-amethyst/20 transition-all text-sm font-semibold justify-center"
          >
            Sign in
          </Link>
        </div>
      </aside>
    </>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 md:ml-72 min-h-screen relative z-10">
        <Header onMenuClick={openSidebar} />
        <main className="pt-14 pb-24 md:pb-20">
          {children}
        </main>
      </div>
    </>
  );
}

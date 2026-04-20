import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "StreamX | Smart Music Streaming",
  description: "Faster than YouTube. Cleaner than Spotify.",
};

import { YoutubePlayerProvider } from '../components/YoutubePlayerProvider';
import { PlayerBar } from '../components/PlayerBar';
import { AppShell } from '../components/AppShell';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        <YoutubePlayerProvider />
        
        {/* Ambient background orbs */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="ambient-orb orb-purple top-[10%] left-[50%] -translate-x-1/2" />
          <div className="ambient-orb orb-pink top-[40%] right-[10%]" />
          <div className="ambient-orb orb-blue top-[60%] left-[10%]" />
        </div>
        
        <AppShell>{children}</AppShell>
        
        <PlayerBar />
      </body>
    </html>
  );
}

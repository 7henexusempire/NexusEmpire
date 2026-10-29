import React, { useEffect, useState } from 'react';
import {
  Layers,
  Sparkles,
  Tv,
  Calendar,
  Wrench,
  Trash2,
  Share2,
  RefreshCw,
  Plus,
  Clock,
  ExternalLink,
  Radio,
} from 'lucide-react';

export type TabKey = 'global' | 'nexus' | 'events' | 'rebuild' | 'dedup' | 'generator';

interface NavbarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  totalChannels: number;
  totalSources: number;
  nextScheduledFetch: number;
  isFetching: boolean;
  onFetchAll: () => void;
  onOpenAddSource: () => void;
  onOpenAddStream: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  totalChannels,
  totalSources,
  nextScheduledFetch,
  isFetching,
  onFetchAll,
  onOpenAddSource,
  onOpenAddStream,
}) => {
  const [countdownText, setCountdownText] = useState('15:00');

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, nextScheduledFetch - now);
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdownText(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextScheduledFetch]);

  const navItems: { key: TabKey; label: string; ariaLabel: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'global', label: 'All Playlists', ariaLabel: 'Tab All Playlists', icon: <Layers className="w-4 h-4" /> },
    { key: 'nexus', label: 'Nexus Empire (Streambox / AniTV)', ariaLabel: 'Tab Nexus Empire', icon: <Radio className="w-4 h-4 text-amber-400" />, badge: 'VIP' },
    { key: 'events', label: 'Fancode & Sony & Zee5', ariaLabel: 'Tab Live Events', icon: <Calendar className="w-4 h-4 text-cyan-400" />, badge: 'LIVE' },
    { key: 'rebuild', label: 'Nexus Rebuild', ariaLabel: 'Tab Nexus Rebuild', icon: <Wrench className="w-4 h-4 text-purple-400" />, badge: 'Studio' },
    { key: 'dedup', label: 'AI Deduplication & Trash', ariaLabel: 'Tab AI Deduplication', icon: <Trash2 className="w-4 h-4 text-rose-400" /> },
    { key: 'generator', label: 'M3U Generator & Endpoints', ariaLabel: 'Tab M3U Generator', icon: <Share2 className="w-4 h-4 text-emerald-400" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full crystal-panel border-b border-white/10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <img
                src="https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547"
                alt="Nexus Empire Logo"
                className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(251,191,36,0.5)] transition-transform group-hover:scale-105"
              />
              <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-cyan-400">
                  NEXUS EMPIRE
                </h1>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  v2.5 VPS Ready
                </span>
              </div>
              <p className="text-xs text-gray-400">Stream Fetcher • Aggregator • Rebuilder</p>
            </div>
          </div>

          {/* Quick stats on mobile */}
          <div className="flex md:hidden items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-black/60 border border-white/10 text-cyan-300 font-mono">
              {totalChannels} streams
            </span>
          </div>
        </div>

        {/* Global Controls & 15m Auto-fetch info */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center md:justify-end">
          {/* 15 Mins Auto-fetch Badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 border border-cyan-500/30 text-xs text-gray-200"
            title="15-minute background auto-fetch runs continuously on VPS"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span className="text-gray-400">Auto-Fetch:</span>
            <span className="font-mono font-semibold text-cyan-300">{countdownText}</span>
          </div>

          {/* Stats Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-gray-300">
            <Tv className="w-3.5 h-3.5 text-amber-400" />
            <span>
              <strong className="text-white font-mono">{totalChannels}</strong> Channels in{' '}
              <strong className="text-white font-mono">{totalSources}</strong> Sources
            </span>
          </div>

          {/* Fetch All Button */}
          <button
            onClick={onFetchAll}
            disabled={isFetching}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              isFetching
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-wait'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 shadow-lg shadow-amber-500/20 active:scale-95'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Fetching 15m...' : 'Fetch All Now'}
          </button>

          {/* Add Source Button */}
          <button
            onClick={onOpenAddSource}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-black/60 hover:bg-black/80 border border-white/20 text-gray-200 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add Source</span>
          </button>

          {/* Add Stream Button */}
          <button
            onClick={onOpenAddStream}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-black/60 hover:bg-black/80 border border-white/20 text-gray-200 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>Add Stream</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav className="max-w-7xl mx-auto mt-3 pt-2 border-t border-white/10 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              aria-label={item.ariaLabel}
              data-testid={`tab-${item.key}`}
              onClick={() => onTabChange(item.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white/15 text-white border border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.15)] font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${
                    item.badge === 'VIP'
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                      : item.badge === 'LIVE'
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 animate-pulse'
                      : 'bg-purple-500/25 text-purple-300 border border-purple-500/40'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};

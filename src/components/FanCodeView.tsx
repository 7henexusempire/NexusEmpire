import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Play,
  Copy,
  Check,
  Search,
  RefreshCw,
  ExternalLink,
  Flame,
  Calendar,
  Radio,
  Download,
  Filter,
} from 'lucide-react';
import { SportsEventItem } from '../types';

import { getCleanOrigin } from '../utils/urlUtils';

interface FanCodeViewProps {
  onNotify: (type: 'success' | 'error' | 'info' | 'loading', title: string, message?: string) => void;
  publicBaseUrl?: string;
  onPreviewChannel: (channel: any) => void;
}

export const FanCodeView: React.FC<FanCodeViewProps> = ({
  onNotify,
  publicBaseUrl = '',
  onPreviewChannel,
}) => {
  const [events, setEvents] = useState<SportsEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const cleanBase = (publicBaseUrl ? publicBaseUrl.replace(':8443', '').replace(':3000', '') : getCleanOrigin());
  const m3uUrl = `${cleanBase}/fancode.m3u`;

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/events/fancode');
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
      onNotify('error', 'Failed to load FanCode events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/events/sync', { method: 'POST' });
      await fetchEvents();
      onNotify('success', 'FanCode Synced', 'Refreshed latest matches and stream links');
    } catch (e) {
      onNotify('error', 'Sync Failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onNotify('success', `Copied ${label}`, text);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const sportsList = Array.from(new Set(events.map((e) => e.sport || e.category || 'Cricket').filter(Boolean)));

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      (e.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.sport || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSport =
      selectedSport === 'all' || (e.sport || e.category || '').toLowerCase() === selectedSport.toLowerCase();

    return matchesSearch && matchesSport;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-slate-900/60 border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  LIVE SPORTS
                </span>
                <span className="text-[11px] text-slate-400">Auto-syncs every 7 minutes</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">FanCode Live Events</h1>
              <p className="text-xs text-slate-400 mt-1">
                Live cricket tournaments, football, and international sports streams with high-bitrate playback.
              </p>
            </div>
          </div>

          {/* Quick M3U & Sync Action */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => copyToClipboard(m3uUrl, 'FanCode M3U URL', 'm3u-main')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              {copiedKey === 'm3u-main' ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
              <span>Copy FanCode M3U</span>
            </button>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* M3U Link Box */}
        <div className="mt-5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 truncate text-slate-300">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-amber-400 uppercase font-bold tracking-wider">
              IPTV URL
            </span>
            <span className="truncate">{m3uUrl}</span>
          </div>
          <button
            onClick={() => copyToClipboard(m3uUrl, 'URL', 'box')}
            className="text-amber-400 hover:text-amber-300 shrink-0 font-sans font-semibold text-[11px]"
          >
            {copiedKey === 'box' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search matches, tournaments, teams..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 outline-none transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedSport('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedSport === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Sports ({events.length})
          </button>
          {sportsList.map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSport.toLowerCase() === sport.toLowerCase()
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium">Fetching FanCode events &amp; streams...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 text-center">
          <Trophy className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">No matches found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Try adjusting your search query or check back when live matches are scheduled.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => {
            const isLive = event.status?.toUpperCase() === 'LIVE';
            const posterImg = event.poster || event.logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547';

            return (
              <div
                key={event.id}
                className="group relative rounded-2xl bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-amber-400/40 transition-all duration-300 overflow-hidden flex flex-col shadow-lg"
              >
                {/* Poster / Thumbnail Header */}
                <div className="relative h-40 bg-slate-950 flex items-center justify-center overflow-hidden">
                  <img
                    src={posterImg}
                    alt={event.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    {isLive ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white shadow-md animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        LIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/80 text-slate-300 border border-slate-700">
                        {event.status || 'SCHEDULED'}
                      </span>
                    )}
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      {event.sport || event.category || 'Cricket'}
                    </span>
                  </div>

                  {/* Play Overlay Button */}
                  {event.url && (
                    <button
                      onClick={() =>
                        onPreviewChannel({
                          id: event.id,
                          name: event.title,
                          url: event.url,
                          logo: posterImg,
                          groupTitle: event.category || 'FanCode Live',
                        })
                      }
                      className="absolute inset-0 m-auto w-12 h-12 rounded-2xl bg-amber-500/90 hover:bg-amber-400 text-slate-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl scale-75 group-hover:scale-100"
                      title="Play live stream"
                    >
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    </button>
                  )}
                </div>

                {/* Details Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{event.startTime || 'Live Match Stream'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    {event.url ? (
                      <>
                        <button
                          onClick={() =>
                            onPreviewChannel({
                              id: event.id,
                              name: event.title,
                              url: event.url,
                              logo: posterImg,
                              groupTitle: event.category || 'FanCode Live',
                            })
                          }
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Watch</span>
                        </button>

                        <button
                          onClick={() => copyToClipboard(event.url, 'Stream URL', event.id)}
                          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all"
                          title="Copy direct stream link"
                        >
                          {copiedKey === event.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">Stream link starting soon</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

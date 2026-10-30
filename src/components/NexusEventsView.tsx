import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Plus,
  Trash2,
  Copy,
  Check,
  Play,
  Search,
  ExternalLink,
  Radio,
  Tv,
  Image,
  RefreshCw,
  X,
  Flame,
  Globe,
  Tag,
  Zap,
} from 'lucide-react';
import { getCleanOrigin } from '../utils/urlUtils';
import { ChannelItem, NexusEventMatch, NexusEventStream } from '../types';

interface NexusEventsViewProps {
  onNotify: (type: 'success' | 'error' | 'info' | 'loading', title: string, message?: string) => void;
  publicBaseUrl?: string;
  onPreviewChannel: (ch: ChannelItem) => void;
}

export const NexusEventsView: React.FC<NexusEventsViewProps> = ({
  onNotify,
  publicBaseUrl = '',
  onPreviewChannel,
}) => {
  const [matches, setMatches] = useState<NexusEventMatch[]>([]);
  const [activeMatch, setActiveMatch] = useState<NexusEventMatch | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Available stream pool from all live sources
  const [streamPool, setStreamPool] = useState<ChannelItem[]>([]);
  const [poolSearch, setPoolSearch] = useState<string>('');
  const [poolCategory, setPoolCategory] = useState<string>('all');
  const [poolLoading, setPoolLoading] = useState<boolean>(false);

  // Modals state
  const [showCreateMatchModal, setShowCreateMatchModal] = useState<boolean>(false);
  const [newMatchTitle, setNewMatchTitle] = useState<string>('');
  const [newMatchSport, setNewMatchSport] = useState<string>('Cricket');
  const [newMatchCategory, setNewMatchCategory] = useState<string>('Live Tournament');
  const [newMatchSlug, setNewMatchSlug] = useState<string>('');
  const [newMatchPoster, setNewMatchPoster] = useState<string>('https://ik.imagekit.io/7henexusempire/nexusprime.png');

  // Add Stream Modal to active match
  const [showAddStreamModal, setShowAddStreamModal] = useState<boolean>(false);
  const [newStreamTitle, setNewStreamTitle] = useState<string>('');
  const [newStreamUrl, setNewStreamUrl] = useState<string>('');
  const [newStreamServerLabel, setNewStreamServerLabel] = useState<string>('Server 1 - Main Feed HD');
  const [newStreamQuality, setNewStreamQuality] = useState<string>('1080p HD');
  const [newStreamLogo, setNewStreamLogo] = useState<string>('');

  // Bulk logo modal
  const [showBulkLogoModal, setShowBulkLogoModal] = useState<boolean>(false);
  const [bulkLogoUrl, setBulkLogoUrl] = useState<string>('');

  // Copied URL states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const cleanBase = publicBaseUrl ? publicBaseUrl.replace(/:8443/g, '').replace(/:3000/g, '') : getCleanOrigin();

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/nexus-events');
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
        if (data.length > 0) {
          if (!activeMatch) {
            setActiveMatch(data[0]);
          } else {
            const current = data.find((m: NexusEventMatch) => m.id === activeMatch.id);
            if (current) setActiveMatch(current);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to load match events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStreamPool = async () => {
    try {
      setPoolLoading(true);
      const res = await fetch('/api/channels?sourceId=all&limit=2500');
      if (res.ok) {
        const data = await res.json();
        setStreamPool(data.channels || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch stream pool for events:', err);
    } finally {
      setPoolLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    fetchStreamPool();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    const cleanText = text.replace(/:8443/g, '').replace(/:3000/g, '');
    navigator.clipboard.writeText(cleanText);
    setCopiedKey(key);
    onNotify('success', 'URL Copied', cleanText);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchTitle.trim()) return;

    try {
      const res = await fetch('/api/nexus-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMatchTitle.trim(),
          sport: newMatchSport,
          category: newMatchCategory,
          slug: newMatchSlug.trim() || newMatchTitle.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          poster: newMatchPoster.trim() || 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
          logo: newMatchPoster.trim() || 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
          status: 'LIVE',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onNotify('success', 'Event Created', `Created live event "${data.match.title}"`);
        setShowCreateMatchModal(false);
        setNewMatchTitle('');
        setNewMatchSlug('');
        await fetchMatches();
        setActiveMatch(data.match);
      }
    } catch (err: any) {
      onNotify('error', 'Creation Failed', err.message);
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this match event playlist?')) return;
    try {
      const res = await fetch(`/api/nexus-events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onNotify('success', 'Event Deleted', 'Event playlist removed');
        const remaining = matches.filter((m) => m.id !== id);
        setMatches(remaining);
        setActiveMatch(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err: any) {
      onNotify('error', 'Delete Failed', err.message);
    }
  };

  // Add Stream from Pool into Active Match
  const handleAddPoolStreamToMatch = async (ch: ChannelItem) => {
    if (!activeMatch) return;

    const serverIndex = activeMatch.streams.length + 1;
    const streamData: Partial<NexusEventStream> = {
      title: `${ch.name} (Live Feed)`,
      url: ch.customUrl || ch.url,
      serverLabel: `Server ${serverIndex} - ${ch.sourceName || ch.sourceId || 'Live'}`,
      logo: ch.customLogo || ch.tvgLogo || ch.logo || activeMatch.logo,
      quality: '1080p HD',
      sourceService: ch.sourceName || ch.sourceId,
    };

    try {
      const res = await fetch(`/api/nexus-events/${activeMatch.id}/streams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streamData),
      });

      if (res.ok) {
        const data = await res.json();
        onNotify('success', 'Stream Added', `Added ${streamData.serverLabel} to ${activeMatch.title}`);
        const updatedStreams = [...activeMatch.streams, data.stream];
        setActiveMatch({ ...activeMatch, streams: updatedStreams });
        fetchMatches();
      }
    } catch (err: any) {
      onNotify('error', 'Add Failed', err.message);
    }
  };

  // Add Custom Stream into Active Match
  const handleAddCustomStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatch || !newStreamUrl.trim()) return;

    try {
      const res = await fetch(`/api/nexus-events/${activeMatch.id}/streams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newStreamTitle.trim() || activeMatch.title,
          url: newStreamUrl.trim(),
          serverLabel: newStreamServerLabel.trim(),
          quality: newStreamQuality,
          logo: newStreamLogo.trim() || activeMatch.logo,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onNotify('success', 'Stream Added', `Added ${data.stream.serverLabel}`);
        setShowAddStreamModal(false);
        setNewStreamTitle('');
        setNewStreamUrl('');
        const updatedStreams = [...activeMatch.streams, data.stream];
        setActiveMatch({ ...activeMatch, streams: updatedStreams });
        fetchMatches();
      }
    } catch (err: any) {
      onNotify('error', 'Add Failed', err.message);
    }
  };

  const handleRemoveStream = async (streamId: string) => {
    if (!activeMatch) return;
    try {
      const res = await fetch(`/api/nexus-events/${activeMatch.id}/streams/${streamId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onNotify('info', 'Stream Removed', 'Removed stream link from match event');
        const updated = activeMatch.streams.filter((s) => s.id !== streamId);
        setActiveMatch({ ...activeMatch, streams: updated });
      }
    } catch (err: any) {
      onNotify('error', 'Remove Failed', err.message);
    }
  };

  const handleBulkApplyLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatch || !bulkLogoUrl.trim()) return;

    try {
      const res = await fetch(`/api/nexus-events/${activeMatch.id}/bulk-logo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: bulkLogoUrl.trim() }),
      });

      if (res.ok) {
        onNotify('success', 'Logo Applied', `Updated match banner & stream logos`);
        setShowBulkLogoModal(false);
        setBulkLogoUrl('');
        await fetchMatches();
      }
    } catch (err: any) {
      onNotify('error', 'Bulk Apply Failed', err.message);
    }
  };

  const poolCategories = Array.from(
    new Set(streamPool.map((c) => c.customGroup || c.groupTitle).filter(Boolean))
  ).sort();

  const filteredPool = streamPool.filter((c) => {
    const textMatch =
      poolSearch === '' ||
      c.name.toLowerCase().includes(poolSearch.toLowerCase()) ||
      (c.groupTitle && c.groupTitle.toLowerCase().includes(poolSearch.toLowerCase()));

    const catMatch = poolCategory === 'all' || (c.customGroup || c.groupTitle) === poolCategory;
    return textMatch && catMatch;
  });

  return (
    <div className="space-y-6">
      {/* 1. Top Banner & Match Switcher */}
      <div className="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500/30 via-amber-500/20 to-orange-500/30 border border-rose-400/40 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/10">
              <Trophy className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Nexus Events Hub</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 border border-rose-400/40 text-rose-300 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                  LIVE EVENT ARCHITECT
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
                Create dedicated M3U playlists for live matches (IPL, Cricket, Football, UFC, F1). Aggregate multiple live stream feeds (Server 1 Hindi, Server 2 English 4K, Sky Sports, Willow) into one instant working URL!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowCreateMatchModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-xs shadow-lg shadow-rose-500/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Live Event Playlist</span>
            </button>
            <button
              onClick={fetchMatches}
              className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-rose-400/50 text-slate-300 hover:text-white transition-all"
              title="Refresh Events"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-rose-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Existing Matches Chips */}
        {matches.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 shrink-0 font-mono">Live Matches:</span>
            {matches.map((m) => {
              const isSelected = activeMatch?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMatch(m)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-rose-500/20 border-rose-400/60 text-rose-200 shadow-lg shadow-rose-950/40'
                      : 'bg-white/[0.04] border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-rose-400" />
                  <span className="truncate max-w-[200px]">{m.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold">
                    {m.streams.length} feeds
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeMatch ? (
        <div className="space-y-6">
          {/* 2. Active Match Details & Clean URL Bar */}
          <div className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                {activeMatch.poster && (
                  <img
                    src={activeMatch.poster}
                    alt=""
                    className="w-14 h-14 rounded-2xl object-cover bg-black/50 border border-white/10 shrink-0 shadow-md"
                    onError={(e) => {
                      (e.target as any).style.display = 'none';
                    }}
                  />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/25 border border-rose-400/50 text-rose-300 flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                      {activeMatch.status}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-white">{activeMatch.title}</h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-amber-300 font-semibold">{activeMatch.sport}</span>
                    <span>·</span>
                    <span>{activeMatch.category}</span>
                    <span>·</span>
                    <span className="font-mono text-slate-300">{activeMatch.startTime}</span>
                  </div>
                </div>
              </div>

              {/* Action tools */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowAddStreamModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/40 text-rose-300 text-xs font-bold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Feed URL</span>
                </button>

                <button
                  onClick={() => setShowBulkLogoModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 text-xs font-semibold transition-all"
                >
                  <Image className="w-3.5 h-3.5 text-amber-400" />
                  <span>Set Poster / Logo</span>
                </button>

                <button
                  onClick={() => handleDeleteMatch(activeMatch.id)}
                  className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors"
                  title="Delete match event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Clean Export URLs - Guaranteed Port-Free */}
            <div className="pt-3 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                    Match Live M3U URL (TiviMate / OTT Navigator)
                  </div>
                  <div className="text-xs font-mono text-slate-200 truncate select-all">
                    {`${cleanBase}/events/${activeMatch.slug}.m3u`}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyToClipboard(`${cleanBase}/events/${activeMatch.slug}.m3u`, 'event-m3u')}
                    className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 hover:text-white"
                    title="Copy URL"
                  >
                    {copiedKey === 'event-m3u' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`/events/${activeMatch.slug}.m3u`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    All Live Events Combined M3U
                  </div>
                  <div className="text-xs font-mono text-slate-200 truncate select-all">
                    {`${cleanBase}/events/all.m3u`}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyToClipboard(`${cleanBase}/events/all.m3u`, 'all-events')}
                    className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 hover:text-white"
                    title="Copy All Events URL"
                  >
                    {copiedKey === 'all-events' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`/events/all.m3u`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Main Split View: Stream Pool Picker vs Match Feeds */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT: Stream Picker from all Live Channels */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-rose-400" />
                    <h3 className="font-bold text-white text-sm">Pick Live Streams for this Match</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {filteredPool.length} channels available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search live streams (e.g. Star, Ten, FanCode)..."
                      value={poolSearch}
                      onChange={(e) => setPoolSearch(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  <select
                    value={poolCategory}
                    onChange={(e) => setPoolCategory(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-400"
                  >
                    <option value="all">All Categories ({poolCategories.length})</option>
                    {poolCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pool List */}
              <div className="bg-black/20 border border-white/10 rounded-2xl p-2 max-h-[560px] overflow-y-auto space-y-1.5 scrollbar-thin">
                {poolLoading ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Loading live channels...</div>
                ) : filteredPool.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">No channels match filter.</div>
                ) : (
                  filteredPool.slice(0, 100).map((ch) => (
                    <div
                      key={ch.id}
                      className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {ch.tvgLogo || ch.logo ? (
                          <img
                            src={ch.tvgLogo || ch.logo}
                            alt=""
                            className="w-7 h-7 rounded-lg object-contain bg-black/40 border border-white/10 shrink-0"
                            onError={(e) => {
                              (e.target as any).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <Tv className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{ch.name}</div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <span className="truncate max-w-[120px]">{ch.groupTitle}</span>
                            <span>·</span>
                            <span className="font-mono text-rose-300">{ch.sourceName || ch.sourceId}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onPreviewChannel(ch)}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white"
                          title="Preview stream"
                        >
                          <Play className="w-3.5 h-3.5 text-amber-400" />
                        </button>

                        <button
                          onClick={() => handleAddPoolStreamToMatch(ch)}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition-all active:scale-95 shadow-md shadow-rose-500/20"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add to Match</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT: Match Feeds and Servers */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-white text-sm">Active Match Feeds</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                    {activeMatch.streams.length} server links
                  </span>
                </div>

                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  ONLINE
                </span>
              </div>

              {/* Feeds List */}
              <div className="bg-black/20 border border-white/10 rounded-2xl p-2 max-h-[560px] overflow-y-auto space-y-2 scrollbar-thin">
                {activeMatch.streams.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                    <p>No streams added to this match event yet.</p>
                    <p className="text-[11px] text-slate-500">Pick live channels from the left or click "Add Custom Feed URL"!</p>
                  </div>
                ) : (
                  activeMatch.streams.map((s, idx) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{s.serverLabel}</h4>
                            <p className="text-[11px] text-slate-400 truncate">{s.title}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                            {s.quality || 'HD'}
                          </span>

                          <button
                            onClick={() =>
                              onPreviewChannel({
                                id: s.id,
                                sourceId: 'nexusevents',
                                name: `${activeMatch.title} (${s.serverLabel})`,
                                url: s.url,
                                groupTitle: activeMatch.category,
                                tvgLogo: s.logo || activeMatch.logo,
                                enabled: true,
                              })
                            }
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white"
                            title="Play feed"
                          >
                            <Play className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          <button
                            onClick={() => handleRemoveStream(s.id)}
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                            title="Remove stream"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span className="truncate max-w-sm">{s.url}</span>
                        <span className="text-amber-400/80 shrink-0">{s.sourceService || 'Live'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400">Loading Nexus Events...</div>
      )}

      {/* Create Live Match Modal */}
      {showCreateMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-rose-400" />
                <span>Create Live Match Event Playlist</span>
              </h3>
              <button onClick={() => setShowCreateMatchModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMatch} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Match Title</label>
                <input
                  type="text"
                  placeholder="e.g. IPL 2025: CSK vs RCB"
                  value={newMatchTitle}
                  onChange={(e) => setNewMatchTitle(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-rose-400 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Sport</label>
                  <select
                    value={newMatchSport}
                    onChange={(e) => setNewMatchSport(e.target.value)}
                    className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
                  >
                    <option value="Cricket">Cricket</option>
                    <option value="Football">Football</option>
                    <option value="WWE / MMA">WWE / MMA</option>
                    <option value="Tennis">Tennis</option>
                    <option value="Motorsport / F1">Motorsport / F1</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Other">Other Sports</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Category / Tournament</label>
                  <input
                    type="text"
                    placeholder="e.g. IPL 2025"
                    value={newMatchCategory}
                    onChange={(e) => setNewMatchCategory(e.target.value)}
                    className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">URL Slug</label>
                <input
                  type="text"
                  placeholder="e.g. ipl-live (creates /events/ipl-live.m3u)"
                  value={newMatchSlug}
                  onChange={(e) => setNewMatchSlug(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-rose-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Event Poster / Logo URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newMatchPoster}
                  onChange={(e) => setNewMatchPoster(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-rose-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateMatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold"
                >
                  Create Match Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Feed URL Modal */}
      {showAddStreamModal && activeMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-400" />
                <span>Add Custom Feed to {activeMatch.title}</span>
              </h3>
              <button onClick={() => setShowAddStreamModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomStream} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Server Label</label>
                <input
                  type="text"
                  placeholder="e.g. Server 1 - Hindi Commentary HD"
                  value={newStreamServerLabel}
                  onChange={(e) => setNewStreamServerLabel(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-rose-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Direct Stream URL (M3U8 / MPD / HLS)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newStreamUrl}
                  onChange={(e) => setNewStreamUrl(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-rose-400 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Quality</label>
                  <select
                    value={newStreamQuality}
                    onChange={(e) => setNewStreamQuality(e.target.value)}
                    className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
                  >
                    <option value="1080p HD">1080p HD</option>
                    <option value="4K UHD">4K Ultra HD</option>
                    <option value="720p HD">720p HD</option>
                    <option value="Auto">Auto Adapt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Display Title</label>
                  <input
                    type="text"
                    placeholder="Feed Title"
                    value={newStreamTitle}
                    onChange={(e) => setNewStreamTitle(e.target.value)}
                    className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Stream Logo URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newStreamLogo}
                  onChange={(e) => setNewStreamLogo(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-rose-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddStreamModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold"
                >
                  Add Stream Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Apply Logo Modal */}
      {showBulkLogoModal && activeMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Image className="w-4 h-4 text-amber-400" />
                <span>Set Poster &amp; Logo for this Match</span>
              </h3>
              <button onClick={() => setShowBulkLogoModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkApplyLogo} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Logo / Banner URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={bulkLogoUrl}
                  onChange={(e) => setBulkLogoUrl(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-rose-400 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowBulkLogoModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold"
                >
                  Apply to Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Search,
  Filter,
  Play,
  Save,
  Tv,
  Radio,
  Image,
  Tag,
  CheckSquare,
  Square,
  ExternalLink,
  Layers,
  ChevronDown,
  X,
  RefreshCw,
  FolderPlus,
  Zap,
} from 'lucide-react';
import { getCleanOrigin } from '../utils/urlUtils';
import { ChannelItem, NexusPrimePlaylist, NexusPrimeStream } from '../types';

interface NexusPrimeViewProps {
  onNotify: (type: 'success' | 'error' | 'info' | 'loading', title: string, message?: string) => void;
  publicBaseUrl?: string;
  onPreviewChannel: (ch: ChannelItem) => void;
}

export const NexusPrimeView: React.FC<NexusPrimeViewProps> = ({
  onNotify,
  publicBaseUrl = '',
  onPreviewChannel,
}) => {
  const [playlists, setPlaylists] = useState<NexusPrimePlaylist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<NexusPrimePlaylist | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Available Stream Pool from ALL playlists/sources
  const [streamPool, setStreamPool] = useState<ChannelItem[]>([]);
  const [poolLoading, setPoolLoading] = useState<boolean>(false);
  const [poolSearch, setPoolSearch] = useState<string>('');
  const [poolCategory, setPoolCategory] = useState<string>('all');
  const [poolSource, setPoolSource] = useState<string>('all');
  const [selectedPoolIds, setSelectedPoolIds] = useState<string[]>([]);

  // Playlist internal filter & search
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Edit Stream Modal
  const [editingStream, setEditingStream] = useState<NexusPrimeStream | null>(null);

  // Bulk Apply Logo Modals
  const [showBulkCategoryLogoModal, setShowBulkCategoryLogoModal] = useState<boolean>(false);
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [bulkCategoryLogoUrl, setBulkCategoryLogoUrl] = useState<string>('');

  const [showBulkAllLogoModal, setShowBulkAllLogoModal] = useState<boolean>(false);
  const [bulkAllLogoUrl, setBulkAllLogoUrl] = useState<string>('');

  // Create New Playlist Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newPlaylistName, setNewPlaylistName] = useState<string>('');
  const [newPlaylistSlug, setNewPlaylistSlug] = useState<string>('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState<string>('');

  // Copied URL state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const cleanBase = publicBaseUrl ? publicBaseUrl.replace(/:8443/g, '').replace(/:3000/g, '') : getCleanOrigin();

  const fetchPlaylists = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/nexusprime');
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data);
        if (data.length > 0) {
          if (!activePlaylist) {
            setActivePlaylist(data[0]);
          } else {
            const current = data.find((p: NexusPrimePlaylist) => p.id === activePlaylist.id);
            if (current) setActivePlaylist(current);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch prime playlists:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStreamPool = async () => {
    try {
      setPoolLoading(true);
      const res = await fetch('/api/channels?sourceId=all&limit=3000');
      if (res.ok) {
        const data = await res.json();
        setStreamPool(data.channels || []);
      }
    } catch (err: any) {
      console.error('Failed to load stream pool:', err);
    } finally {
      setPoolLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
    fetchStreamPool();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    const cleanText = text.replace(/:8443/g, '').replace(/:3000/g, '');
    navigator.clipboard.writeText(cleanText);
    setCopiedKey(key);
    onNotify('success', 'URL Copied', cleanText);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const res = await fetch('/api/nexusprime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlaylistName.trim(),
          slug: newPlaylistSlug.trim() || newPlaylistName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          description: newPlaylistDesc.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onNotify('success', 'Playlist Created', `Created ${data.playlist.name}`);
        setShowCreateModal(false);
        setNewPlaylistName('');
        setNewPlaylistSlug('');
        setNewPlaylistDesc('');
        await fetchPlaylists();
        setActivePlaylist(data.playlist);
      }
    } catch (err: any) {
      onNotify('error', 'Creation Failed', err.message);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Nexus Prime playlist?')) return;
    try {
      const res = await fetch(`/api/nexusprime/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onNotify('success', 'Playlist Deleted', 'Playlist removed');
        const remaining = playlists.filter((p) => p.id !== id);
        setPlaylists(remaining);
        setActivePlaylist(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err: any) {
      onNotify('error', 'Delete Failed', err.message);
    }
  };

  // Add single channel from pool into active playlist
  const handleAddStreamToPlaylist = async (channel: ChannelItem) => {
    if (!activePlaylist) return;

    const streamData: Partial<NexusPrimeStream> = {
      name: channel.customName || channel.name,
      url: channel.customUrl || channel.url,
      groupTitle: channel.customGroup || channel.groupTitle || 'General',
      logo: channel.customLogo || channel.tvgLogo || channel.logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
      groupLogo: channel.customGroupLogo || channel.groupLogo,
      tvgId: channel.tvgId,
      tvgName: channel.tvgName || channel.name,
      tvgChno: channel.customChno || channel.tvgChno,
      sourceOrigin: channel.sourceName || channel.sourceId,
    };

    try {
      const res = await fetch(`/api/nexusprime/${activePlaylist.id}/streams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streamData),
      });

      if (res.ok) {
        const data = await res.json();
        onNotify('success', 'Stream Added', `Added "${streamData.name}"`);
        // Update local state
        const updatedStreams = [...activePlaylist.streams, data.stream];
        setActivePlaylist({ ...activePlaylist, streams: updatedStreams });
        fetchPlaylists();
      }
    } catch (err: any) {
      onNotify('error', 'Add Failed', err.message);
    }
  };

  // Bulk add selected streams from pool into active playlist
  const handleBulkAddSelected = async () => {
    if (!activePlaylist || selectedPoolIds.length === 0) return;

    const selectedChannels = streamPool.filter((c) => selectedPoolIds.includes(c.id));
    const streamsToAdd = selectedChannels.map((channel) => ({
      name: channel.customName || channel.name,
      url: channel.customUrl || channel.url,
      groupTitle: channel.customGroup || channel.groupTitle || 'General',
      logo: channel.customLogo || channel.tvgLogo || channel.logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
      groupLogo: channel.customGroupLogo || channel.groupLogo,
      tvgId: channel.tvgId,
      tvgName: channel.tvgName || channel.name,
      tvgChno: channel.customChno || channel.tvgChno,
      sourceOrigin: channel.sourceName || channel.sourceId,
    }));

    try {
      const res = await fetch(`/api/nexusprime/${activePlaylist.id}/streams/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streams: streamsToAdd }),
      });

      if (res.ok) {
        onNotify('success', 'Bulk Streams Added', `Added ${streamsToAdd.length} streams to ${activePlaylist.name}`);
        setSelectedPoolIds([]);
        await fetchPlaylists();
      }
    } catch (err: any) {
      onNotify('error', 'Bulk Add Failed', err.message);
    }
  };

  const handleRemoveStream = async (streamId: string) => {
    if (!activePlaylist) return;

    try {
      const res = await fetch(`/api/nexusprime/${activePlaylist.id}/streams/${streamId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onNotify('info', 'Stream Removed', 'Removed stream from playlist');
        const updated = activePlaylist.streams.filter((s) => s.id !== streamId);
        setActivePlaylist({ ...activePlaylist, streams: updated });
      }
    } catch (err: any) {
      onNotify('error', 'Remove Failed', err.message);
    }
  };

  const handleSaveStreamEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlaylist || !editingStream) return;

    try {
      const res = await fetch(
        `/api/nexusprime/${activePlaylist.id}/streams/${editingStream.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingStream),
        }
      );

      if (res.ok) {
        onNotify('success', 'Stream Updated', `Saved "${editingStream.name}"`);
        const updated = activePlaylist.streams.map((s) =>
          s.id === editingStream.id ? editingStream : s
        );
        setActivePlaylist({ ...activePlaylist, streams: updated });
        setEditingStream(null);
      }
    } catch (err: any) {
      onNotify('error', 'Update Failed', err.message);
    }
  };

  // Bulk Apply Logo to Category
  const handleApplyLogoToCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlaylist || !targetCategory || !bulkCategoryLogoUrl) return;

    try {
      const res = await fetch(
        `/api/nexusprime/${activePlaylist.id}/bulk-category-logo`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: targetCategory,
            logoUrl: bulkCategoryLogoUrl.trim(),
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        onNotify(
          'success',
          'Category Logo Applied',
          `Updated logo for ${data.updatedCount} streams in "${targetCategory}"`
        );
        setShowBulkCategoryLogoModal(false);
        setBulkCategoryLogoUrl('');
        await fetchPlaylists();
      }
    } catch (err: any) {
      onNotify('error', 'Failed to apply category logo', err.message);
    }
  };

  // Bulk Apply Logo to ALL Streams in Playlist
  const handleApplyLogoToAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlaylist || !bulkAllLogoUrl) return;

    try {
      const res = await fetch(
        `/api/nexusprime/${activePlaylist.id}/bulk-all-logo`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logoUrl: bulkAllLogoUrl.trim() }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        onNotify(
          'success',
          'Logo Applied to ALL Streams',
          `Applied logo to all ${data.updatedCount} streams in ${activePlaylist.name}`
        );
        setShowBulkAllLogoModal(false);
        setBulkAllLogoUrl('');
        await fetchPlaylists();
      }
    } catch (err: any) {
      onNotify('error', 'Failed to apply logo to all', err.message);
    }
  };

  // Filter Pool
  const poolCategories = Array.from(
    new Set(streamPool.map((c) => c.customGroup || c.groupTitle).filter(Boolean))
  ).sort();

  const poolSources = Array.from(
    new Set(streamPool.map((c) => c.sourceName || c.sourceId).filter(Boolean))
  ).sort();

  const filteredPool = streamPool.filter((c) => {
    const nameMatch =
      poolSearch === '' ||
      c.name.toLowerCase().includes(poolSearch.toLowerCase()) ||
      (c.groupTitle && c.groupTitle.toLowerCase().includes(poolSearch.toLowerCase()));

    const catMatch =
      poolCategory === 'all' || (c.customGroup || c.groupTitle) === poolCategory;

    const srcMatch =
      poolSource === 'all' || (c.sourceName || c.sourceId) === poolSource;

    return nameMatch && catMatch && srcMatch;
  });

  // Filter Active Playlist Streams
  const playlistCategories = activePlaylist
    ? Array.from(new Set(activePlaylist.streams.map((s) => s.groupTitle).filter(Boolean))).sort()
    : [];

  const filteredPlaylistStreams = activePlaylist
    ? activePlaylist.streams.filter((s) => {
        const nameMatch =
          activeSearch === '' ||
          s.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
          s.groupTitle.toLowerCase().includes(activeSearch.toLowerCase());

        const catMatch =
          activeCategoryFilter === 'all' || s.groupTitle === activeCategoryFilter;

        return nameMatch && catMatch;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Playlists Switcher */}
      <div className="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/30 via-yellow-500/20 to-orange-500/30 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Nexus Prime Studio</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-400/40 text-amber-300 uppercase tracking-wider">
                  MASTER BUILDER
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
                Aggregate, curate, and compose custom master playlists picking any stream from any source (PlugX, StalkMax, FanCode, SonyLIV, Zee5, CloudStream, etc.). Customize groups, stream logos, and apply category logos in bulk!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Prime Playlist</span>
            </button>
            <button
              onClick={fetchPlaylists}
              className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-amber-400/50 text-slate-300 hover:text-white transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Existing Playlists Chips */}
        {playlists.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 shrink-0 font-mono">Playlists:</span>
            {playlists.map((pl) => {
              const isSelected = activePlaylist?.id === pl.id;
              return (
                <button
                  key={pl.id}
                  onClick={() => setActivePlaylist(pl)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 shadow-lg shadow-amber-950/40'
                      : 'bg-white/[0.04] border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>{pl.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-black/50 text-amber-300 font-bold">
                    {pl.streams.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activePlaylist ? (
        <div className="space-y-6">
          {/* 2. Active Playlist Control & URL Bar */}
          <div className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-white">{activePlaylist.name}</h2>
                  <span className="text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-400/30 px-2 py-0.5 rounded-lg">
                    /{activePlaylist.slug}.m3u
                  </span>
                </div>
                <p className="text-xs text-slate-400">{activePlaylist.description}</p>
              </div>

              {/* Bulk Logo & Action Tools */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowBulkCategoryLogoModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-amber-300 text-xs font-semibold transition-all"
                  title="Apply a TVG Logo to all streams in a category"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Category Logo (Bulk)</span>
                </button>

                <button
                  onClick={() => setShowBulkAllLogoModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 text-xs font-bold transition-all"
                  title="Apply a Logo to all streams across this entire playlist"
                >
                  <Image className="w-3.5 h-3.5 text-amber-400" />
                  <span>Apply Logo to All</span>
                </button>

                <button
                  onClick={() => handleDeletePlaylist(activePlaylist.id)}
                  className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors"
                  title="Delete playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Clean Export URLs - Guaranteed Port-free */}
            <div className="pt-3 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    Direct M3U URL (OTT Navigator / TiviMate)
                  </div>
                  <div className="text-xs font-mono text-slate-200 truncate select-all">
                    {`${cleanBase}/nexusprime/${activePlaylist.slug}.m3u`}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyToClipboard(`${cleanBase}/nexusprime/${activePlaylist.slug}.m3u`, 'm3u')}
                    className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 hover:text-white"
                    title="Copy URL"
                  >
                    {copiedKey === 'm3u' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`/nexusprime/${activePlaylist.slug}.m3u`}
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
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                    Clean Root Shortcut
                  </div>
                  <div className="text-xs font-mono text-slate-200 truncate select-all">
                    {`${cleanBase}/${activePlaylist.slug}.m3u`}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyToClipboard(`${cleanBase}/${activePlaylist.slug}.m3u`, 'root')}
                    className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 hover:text-white"
                    title="Copy Root URL"
                  >
                    {copiedKey === 'root' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`/${activePlaylist.slug}.m3u`}
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

          {/* 3. Main Split View: Stream Pool (Left) vs Active Playlist Streams (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT: Stream Pool Picker */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-white text-sm">Stream Aggregator Pool</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300">
                      {filteredPool.length} available
                    </span>
                  </div>

                  {selectedPoolIds.length > 0 && (
                    <button
                      onClick={handleBulkAddSelected}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Selected ({selectedPoolIds.length})</span>
                    </button>
                  )}
                </div>

                {/* Pool Search & Filter */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="relative sm:col-span-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search channels..."
                      value={poolSearch}
                      onChange={(e) => setPoolSearch(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <select
                    value={poolCategory}
                    onChange={(e) => setPoolCategory(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">All Categories ({poolCategories.length})</option>
                    {poolCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <select
                    value={poolSource}
                    onChange={(e) => setPoolSource(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">All Sources ({poolSources.length})</option>
                    {poolSources.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stream Pool List */}
              <div className="bg-black/20 border border-white/10 rounded-2xl p-2 max-h-[580px] overflow-y-auto space-y-1.5 scrollbar-thin">
                {poolLoading ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Loading stream pool...</div>
                ) : filteredPool.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">No streams match your filter.</div>
                ) : (
                  filteredPool.slice(0, 100).map((ch) => {
                    const isSelected = selectedPoolIds.includes(ch.id);
                    const isAlreadyInPlaylist = activePlaylist.streams.some(
                      (s) => s.url === ch.url || s.name === ch.name
                    );

                    return (
                      <div
                        key={ch.id}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400/50'
                            : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => {
                              setSelectedPoolIds((prev) =>
                                isSelected ? prev.filter((id) => id !== ch.id) : [...prev, ch.id]
                              );
                            }}
                            className="text-slate-400 hover:text-white"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>

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
                              <span className="font-mono text-amber-400/80">{ch.sourceName || ch.sourceId}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onPreviewChannel(ch)}
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white"
                            title="Preview Stream"
                          >
                            <Play className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          <button
                            onClick={() => handleAddStreamToPlaylist(ch)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                              isAlreadyInPlaylist
                                ? 'bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                            }`}
                            title={isAlreadyInPlaylist ? 'Already added (Click to add copy)' : 'Add to Playlist'}
                          >
                            <Plus className="w-3 h-3" />
                            <span>{isAlreadyInPlaylist ? 'Added' : 'Add'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT: Active Playlist Streams Manager */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-white text-sm">Playlist Channels &amp; Bouquets</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                      {activePlaylist.streams.length} total
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {playlistCategories.length} categories
                  </span>
                </div>

                {/* Search & Category Filter for Active Playlist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search inside playlist..."
                      value={activeSearch}
                      onChange={(e) => setActiveSearch(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <select
                    value={activeCategoryFilter}
                    onChange={(e) => setActiveCategoryFilter(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">All Categories ({playlistCategories.length})</option>
                    {playlistCategories.map((c) => (
                      <option key={c} value={c}>
                        {c} ({activePlaylist.streams.filter((s) => s.groupTitle === c).length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Streams List inside Active Playlist */}
              <div className="bg-black/20 border border-white/10 rounded-2xl p-2 max-h-[580px] overflow-y-auto space-y-1.5 scrollbar-thin">
                {filteredPlaylistStreams.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                    <p>No streams in this playlist yet.</p>
                    <p className="text-[11px] text-slate-500">Pick channels from the left aggregator pool to build your bouquet!</p>
                  </div>
                ) : (
                  filteredPlaylistStreams.map((stream) => (
                    <div
                      key={stream.id}
                      className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {stream.logo ? (
                          <img
                            src={stream.logo}
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
                          <div className="text-xs font-semibold text-white truncate">{stream.name}</div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <span className="text-amber-300 font-medium truncate max-w-[120px]">
                              {stream.groupTitle}
                            </span>
                            <span>·</span>
                            <span className="font-mono text-slate-500 truncate max-w-[100px]">{stream.sourceOrigin}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() =>
                            onPreviewChannel({
                              id: stream.id,
                              sourceId: 'nexusprime',
                              name: stream.name,
                              url: stream.url,
                              groupTitle: stream.groupTitle,
                              tvgLogo: stream.logo,
                              enabled: true,
                            })
                          }
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white"
                          title="Play Stream"
                        >
                          <Play className="w-3.5 h-3.5 text-amber-400" />
                        </button>

                        <button
                          onClick={() => setEditingStream(stream)}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-amber-300"
                          title="Edit Stream Attributes"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleRemoveStream(stream.id)}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                          title="Remove from Playlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400">Loading Nexus Prime Studio...</div>
      )}

      {/* Edit Stream Modal */}
      {editingStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Edit Stream Channel</span>
              </h3>
              <button onClick={() => setEditingStream(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStreamEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Stream Name</label>
                <input
                  type="text"
                  value={editingStream.name}
                  onChange={(e) => setEditingStream({ ...editingStream, name: e.target.value })}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Stream URL</label>
                <input
                  type="text"
                  value={editingStream.url}
                  onChange={(e) => setEditingStream({ ...editingStream, url: e.target.value })}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Category / Group-Title</label>
                <input
                  type="text"
                  value={editingStream.groupTitle}
                  onChange={(e) => setEditingStream({ ...editingStream, groupTitle: e.target.value })}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Channel Logo URL (tvg-logo)</label>
                <input
                  type="text"
                  value={editingStream.logo || ''}
                  onChange={(e) => setEditingStream({ ...editingStream, logo: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">TVG ID (EPG)</label>
                  <input
                    type="text"
                    value={editingStream.tvgId || ''}
                    onChange={(e) => setEditingStream({ ...editingStream, tvgId: e.target.value })}
                    className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Channel Number (Chno)</label>
                  <input
                    type="text"
                    value={editingStream.tvgChno || ''}
                    onChange={(e) => setEditingStream({ ...editingStream, tvgChno: e.target.value })}
                    className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingStream(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Category Logo Modal */}
      {showBulkCategoryLogoModal && activePlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>Bulk Apply Category Logo</span>
              </h3>
              <button
                onClick={() => setShowBulkCategoryLogoModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLogoToCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Select Target Category</label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-400 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Category --</option>
                  {playlistCategories.map((c) => (
                    <option key={c} value={c}>
                      {c} ({activePlaylist.streams.filter((s) => s.groupTitle === c).length} streams)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Logo Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={bulkCategoryLogoUrl}
                  onChange={(e) => setBulkCategoryLogoUrl(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowBulkCategoryLogoModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Apply to Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Apply Logo to ALL Modal */}
      {showBulkAllLogoModal && activePlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Image className="w-4 h-4 text-amber-400" />
                <span>Apply Logo to ALL Streams</span>
              </h3>
              <button
                onClick={() => setShowBulkAllLogoModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              This will update the TVG-Logo for all <span className="font-bold text-amber-300">{activePlaylist.streams.length} streams</span> in "{activePlaylist.name}".
            </p>

            <form onSubmit={handleApplyLogoToAll} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Global Logo Image URL</label>
                <input
                  type="text"
                  placeholder="https://ik.imagekit.io/..."
                  value={bulkAllLogoUrl}
                  onChange={(e) => setBulkAllLogoUrl(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowBulkAllLogoModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Apply to All
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Create New Nexus Prime Playlist</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Playlist Name</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Sports & Cinema Master"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">URL Slug</label>
                <input
                  type="text"
                  placeholder="e.g. vip-master (generates /vip-master.m3u)"
                  value={newPlaylistSlug}
                  onChange={(e) => setNewPlaylistSlug(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Description of this bouquet..."
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white text-[11px] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

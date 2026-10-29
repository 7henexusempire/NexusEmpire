import React, { useState, useEffect } from 'react';
import {
  ListMusic,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  Edit3,
  Globe,
  Radio,
  FileCode,
  ShieldCheck,
  AlertCircle,
  Play,
  Layers,
  Sparkles,
  Upload,
  Trophy,
  Flame,
  RadioTower,
  Tv,
  Search,
  X,
  Save,
  Download,
  Image,
  Tag
} from 'lucide-react';
import { PlaylistSource, ChannelItem } from '../types';
import { getCleanOrigin } from '../utils/urlUtils';

interface PlaylistsViewProps {
  onNotify: (type: 'success' | 'error' | 'info', message: string, details?: string) => void;
  onOpenSources: () => void;
  onOpenUpload: () => void;
}

interface DetailPlaylist {
  id: string;
  name: string;
  url: string;
  slug: string;
  type: 'master' | 'source';
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({ onNotify, onOpenSources, onOpenUpload }) => {
  const [sources, setSources] = useState<PlaylistSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedPlaylistJson, setSelectedPlaylistJson] = useState<{ name: string; data: any } | null>(null);

  // Full Playlist Detail & Editing Modal State
  const [detailPlaylist, setDetailPlaylist] = useState<DetailPlaylist | null>(null);
  const [playlistChannels, setPlaylistChannels] = useState<any[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [channelSearch, setChannelSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');

  // Edit Single Channel State
  const [editingChannel, setEditingChannel] = useState<any | null>(null);

  // Add Stream State
  const [showAddStream, setShowAddStream] = useState(false);
  const [newStreamData, setNewStreamData] = useState({
    name: '',
    url: '',
    group: 'General',
    logo: '',
    tvgId: '',
  });

  // Bulk Category Logo State
  const [showBulkLogoModal, setShowBulkLogoModal] = useState(false);
  const [targetBulkCategory, setTargetBulkCategory] = useState('');
  const [bulkLogoUrl, setBulkLogoUrl] = useState('');

  // Rename Category State
  const [showRenameCategoryModal, setShowRenameCategoryModal] = useState(false);
  const [categoryOldName, setCategoryOldName] = useState('');
  const [categoryNewName, setCategoryNewName] = useState('');

  const cleanOrigin = getCleanOrigin();

  const fetchSources = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/sources');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSources(data);
        }
      }
    } catch (err: any) {
      console.error('Failed to load playlist sources:', err);
      onNotify('error', 'Failed to load sources', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  // Fetch channels for selected detail playlist
  const loadPlaylistChannels = async (playlist: DetailPlaylist) => {
    setIsLoadingChannels(true);
    try {
      if (playlist.id === 'fancode-hub') {
        const res = await fetch('/api/events?service=fancode');
        if (res.ok) setPlaylistChannels(await res.json());
      } else if (playlist.id === 'sonyliv-hub') {
        const res = await fetch('/api/events?service=sonyliv');
        if (res.ok) setPlaylistChannels(await res.json());
      } else if (playlist.id === 'zee5-hub') {
        const res = await fetch('/api/events?service=zee5');
        if (res.ok) setPlaylistChannels(await res.json());
      } else if (playlist.id === 'nexusempire-vip') {
        const res = await fetch('/api/nexusempire');
        if (res.ok) setPlaylistChannels(await res.json());
      } else if (playlist.id === 'cloudstream-hub') {
        const res = await fetch('/api/cloudstream/items');
        if (res.ok) setPlaylistChannels(await res.json());
      } else if (playlist.id === 'skystream-hub') {
        const res = await fetch('/api/skystream/extensions');
        if (res.ok) {
          const data = await res.json();
          setPlaylistChannels(data.items || []);
        }
      } else if (playlist.id === 'stremio-hub') {
        const res = await fetch('/api/cncverse/streams');
        if (res.ok) {
          const data = await res.json();
          setPlaylistChannels(data.streams || []);
        }
      } else {
        // Standard source or Master All
        const srcParam = playlist.type === 'source' ? playlist.id : 'all';
        const res = await fetch(`/api/channels?sourceId=${encodeURIComponent(srcParam)}&limit=1000`);
        if (res.ok) {
          const data = await res.json();
          setPlaylistChannels(data.channels || []);
        }
      }
    } catch (err: any) {
      console.error('Failed to load playlist channels:', err);
      onNotify('error', 'Failed to load streams', err.message);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  const handleOpenDetail = (playlist: DetailPlaylist) => {
    setDetailPlaylist(playlist);
    setChannelSearch('');
    setSelectedGroup('all');
    loadPlaylistChannels(playlist);
  };

  const handleSyncSource = async (id: string) => {
    try {
      onNotify('info', 'Syncing Playlist...', 'Fetching fresh streams from remote source');
      const res = await fetch(`/api/sync?sourceId=${encodeURIComponent(id)}`, { method: 'POST' });
      if (res.ok) {
        onNotify('success', 'Playlist Synced Successfully!');
        fetchSources();
        if (detailPlaylist) loadPlaylistChannels(detailPlaylist);
      } else {
        throw new Error('Sync failed');
      }
    } catch (err: any) {
      onNotify('error', 'Sync Error', err.message);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm('Are you sure you want to remove this playlist source?')) return;
    try {
      const res = await fetch(`/api/sources/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        onNotify('success', 'Playlist Source Removed');
        fetchSources();
        if (detailPlaylist?.id === id) setDetailPlaylist(null);
      }
    } catch (err: any) {
      onNotify('error', 'Failed to remove source', err.message);
    }
  };

  const copyToClipboard = (text: string, label: string, key: string) => {
    const cleanText = text.replace(/:8443/g, '').replace(/:3000/g, '');
    navigator.clipboard.writeText(cleanText);
    setCopiedKey(key);
    onNotify('success', `Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleInspectJson = async (source: PlaylistSource) => {
    try {
      const targetSlug = source.slug || source.id;
      const res = await fetch(`/api/playlist/${targetSlug}.json`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPlaylistJson({ name: source.name, data });
      } else {
        const fallbackRes = await fetch(`/api/playlist/all.json`);
        const data = await fallbackRes.json();
        setSelectedPlaylistJson({ name: source.name, data });
      }
    } catch (err: any) {
      onNotify('error', 'Failed to inspect JSON', err.message);
    }
  };

  // Save Channel Edit
  const handleSaveChannel = async () => {
    if (!editingChannel) return;
    try {
      if (['fancode-hub', 'sonyliv-hub', 'zee5-hub'].includes(detailPlaylist?.id || '')) {
        const res = await fetch(`/api/events/${editingChannel.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingChannel),
        });
        if (res.ok) {
          onNotify('success', 'Event Updated', `Saved "${editingChannel.title || editingChannel.name}"`);
          setEditingChannel(null);
          if (detailPlaylist) loadPlaylistChannels(detailPlaylist);
        }
      } else if (detailPlaylist?.id === 'nexusempire-vip') {
        const res = await fetch(`/api/nexusempire/items/${editingChannel.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingChannel),
        });
        if (res.ok) {
          onNotify('success', 'Nexus Item Updated', `Saved "${editingChannel.name}"`);
          setEditingChannel(null);
          if (detailPlaylist) loadPlaylistChannels(detailPlaylist);
        }
      } else {
        const res = await fetch(`/api/channels/${editingChannel.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customName: editingChannel.customName || editingChannel.name,
            customGroup: editingChannel.customGroup || editingChannel.groupTitle || editingChannel.category,
            customLogo: editingChannel.customLogo || editingChannel.logo,
            customUrl: editingChannel.customUrl || editingChannel.url,
          }),
        });
        if (res.ok) {
          onNotify('success', 'Channel Updated', `Saved changes for "${editingChannel.name}"`);
          setEditingChannel(null);
          if (detailPlaylist) loadPlaylistChannels(detailPlaylist);
        }
      }
    } catch (err: any) {
      onNotify('error', 'Failed to save channel', err.message);
    }
  };

  // Delete Channel
  const handleDeleteChannel = async (channelId: string, channelName: string) => {
    if (!confirm(`Delete stream "${channelName}"?`)) return;
    try {
      if (['fancode-hub', 'sonyliv-hub', 'zee5-hub'].includes(detailPlaylist?.id || '')) {
        const res = await fetch(`/api/events/${channelId}`, { method: 'DELETE' });
        if (res.ok) {
          onNotify('success', 'Stream Deleted');
          if (detailPlaylist) loadPlaylistChannels(detailPlaylist);
        }
      } else if (detailPlaylist?.id === 'nexusempire-vip') {
        const res = await fetch(`/api/nexusempire/items/${channelId}`, { method: 'DELETE' });
        if (res.ok) {
          onNotify('success', 'Item Deleted');
          if (detailPlaylist) loadPlaylistChannels(detailPlaylist);
        }
      } else {
        const res = await fetch(`/api/channels/${channelId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: false }),
        });
        if (res.ok) {
          onNotify('success', 'Channel Removed');
          if (detailPlaylist) loadPlaylistChannels(detailPlaylist);
        }
      }
    } catch (err: any) {
      onNotify('error', 'Failed to delete channel', err.message);
    }
  };

  // Add Stream
  const handleAddCustomStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreamData.name || !newStreamData.url) return;
    try {
      const res = await fetch('/api/channels/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStreamData),
      });
      if (res.ok) {
        onNotify('success', 'Stream Added', `Added "${newStreamData.name}"`);
        setNewStreamData({ name: '', url: '', group: 'General', logo: '', tvgId: '' });
        setShowAddStream(false);
        if (detailPlaylist) loadPlaylistChannels(detailPlaylist);
      }
    } catch (err: any) {
      onNotify('error', 'Failed to add stream', err.message);
    }
  };

  // Apply Bulk Category Logo
  const handleApplyBulkCategoryLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBulkCategory || !bulkLogoUrl) return;
    try {
      if (['fancode-hub', 'sonyliv-hub', 'zee5-hub'].includes(detailPlaylist?.id || '')) {
        const service = detailPlaylist?.id.split('-')[0] || 'all';
        const res = await fetch('/api/events/bulk-category-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryName: targetBulkCategory, logoUrl: bulkLogoUrl, service }),
        });
        if (res.ok) {
          onNotify('success', 'Category Logo Updated', `Applied new logo to all streams in "${targetBulkCategory}"`);
          setShowBulkLogoModal(false);
          if (detailPlaylist) loadPlaylistChannels(detailPlaylist);
        }
      } else {
        const res = await fetch('/api/groups/bulk-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupNames: [targetBulkCategory], logoUrl: bulkLogoUrl }),
        });
        if (res.ok) {
          onNotify('success', 'Category Logo Updated', `Applied logo to all channels in "${targetBulkCategory}"`);
          setShowBulkLogoModal(false);
          if (detailPlaylist) loadPlaylistChannels(detailPlaylist);
        }
      }
    } catch (err: any) {
      onNotify('error', 'Failed to update category logo', err.message);
    }
  };

  // Rename Category
  const handleRenameCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryOldName || !categoryNewName) return;
    try {
      if (['fancode-hub', 'sonyliv-hub', 'zee5-hub'].includes(detailPlaylist?.id || '')) {
        const service = detailPlaylist?.id.split('-')[0] || 'all';
        const res = await fetch('/api/events/rename-category', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldCategory: categoryOldName, newCategory: categoryNewName, service }),
        });
        if (res.ok) {
          onNotify('success', 'Category Renamed', `Renamed "${categoryOldName}" to "${categoryNewName}"`);
          setShowRenameCategoryModal(false);
          if (detailPlaylist) loadPlaylistChannels(detailPlaylist);
        }
      } else {
        const res = await fetch('/api/groups/rename', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldName: categoryOldName, newName: categoryNewName }),
        });
        if (res.ok) {
          onNotify('success', 'Category Renamed', `Renamed "${categoryOldName}" to "${categoryNewName}"`);
          setShowRenameCategoryModal(false);
          if (detailPlaylist) loadPlaylistChannels(detailPlaylist);
        }
      }
    } catch (err: any) {
      onNotify('error', 'Failed to rename category', err.message);
    }
  };

  const masterHubs = [
    {
      id: 'master-all',
      name: 'Master Combined M3U',
      url: `${cleanOrigin}/playlist.m3u`,
      slug: 'all',
      icon: <Radio className="w-5 h-5 text-amber-400" />,
      badge: 'ALL IN ONE',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Unified M3U containing all active streams, channels & live sources with zero duplicates.',
    },
    {
      id: 'nexusempire-vip',
      name: 'Nexus Empire VIP Catalog',
      url: `${cleanOrigin}/nexusempire/all.m3u`,
      slug: 'nexusempire',
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      badge: 'VIP NATIVE',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'AniTv & StreamBox native catalog with Willow, Sony, Live Events and adult streams.',
    },
    {
      id: 'fancode-hub',
      name: 'FanCode Live Sports M3U',
      url: `${cleanOrigin}/fancode.m3u`,
      slug: 'fancode',
      icon: <Trophy className="w-5 h-5 text-amber-400" />,
      badge: 'FANCODE',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Live Cricket, EPL, Football and Tournament streams updated every 7 mins.',
    },
    {
      id: 'sonyliv-hub',
      name: 'SonyLIV Network & Sports M3U',
      url: `${cleanOrigin}/sonyliv.m3u`,
      slug: 'sonyliv',
      icon: <Tv className="w-5 h-5 text-indigo-400" />,
      badge: 'SONY LIV',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      description: 'Sony Ten 1/2/3/4/5 HD, Sony SAB HD & Live Sports events.',
    },
    {
      id: 'zee5-hub',
      name: 'Zee5 Live Channels M3U',
      url: `${cleanOrigin}/zee5.m3u`,
      slug: 'zee5',
      icon: <Radio className="w-5 h-5 text-cyan-400" />,
      badge: 'ZEE5',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      description: 'Zee TV, Zee Cinema, Regional Channels & Live Feeds.',
    },
    {
      id: 'cloudstream-hub',
      name: 'CloudStream Extension Relay',
      url: `${cleanOrigin}/cloudstream.m3u`,
      slug: 'cloudstream',
      icon: <Flame className="w-5 h-5 text-orange-400" />,
      badge: 'CLOUDSTREAM',
      badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      description: 'Cricfy Live, SKTech and CloudStream extension repository feeds.',
    },
    {
      id: 'skystream-hub',
      name: 'SkyStream Global M3U',
      url: `${cleanOrigin}/skystream.m3u`,
      slug: 'skystream',
      icon: <Globe className="w-5 h-5 text-amber-300" />,
      badge: 'SKYSTREAM',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Sky Sports, TNT, Willow and global satellite relays.',
    },
    {
      id: 'stremio-hub',
      name: 'Nuvio & Stremio Addons M3U',
      url: `${cleanOrigin}/stremio.m3u`,
      slug: 'stremio',
      icon: <RadioTower className="w-5 h-5 text-yellow-400" />,
      badge: 'STREMIO',
      badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      description: 'Stremio addon feeds, CyberFlix, Torrentio & Nuvio bridge.',
    },
  ];

  // Derived groups for active detail playlist
  const channelGroups = Array.from(
    new Set(
      playlistChannels
        .map((c) => c.customGroup || c.groupTitle || c.category || c.categoryName || 'General')
        .filter(Boolean)
    )
  ).sort();

  // Filtered channels
  const filteredChannels = playlistChannels.filter((c) => {
    const name = (c.customName || c.title || c.name || '').toLowerCase();
    const grp = (c.customGroup || c.groupTitle || c.category || c.categoryName || '').toLowerCase();
    const matchSearch = !channelSearch || name.includes(channelSearch.toLowerCase()) || grp.includes(channelSearch.toLowerCase());
    const matchGrp = selectedGroup === 'all' || grp === selectedGroup.toLowerCase();
    return matchSearch && matchGrp;
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* 1. HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/90 via-slate-900/90 to-slate-950/95 border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <ListMusic className="w-3 h-3 text-cyan-400" />
                <span>PLAYLISTA CENTRAL HUB</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-[10px] font-mono text-amber-300">
                PlugX, StalkMax, FanCode, SonyLIV &amp; Custom Playlists
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2 font-mono">
              <span>Playlista Hub</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400 text-lg sm:text-xl font-sans font-bold">
                Live Directory &amp; Full Detail Manager
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Complete directory of all M3U playlists, PHP feeds, Cloudflare Workers, and JSON endpoints. Click any playlist card to inspect, edit streams, rename categories, or apply category logos cleanly without port numbers!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenSources}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Playlist Source</span>
            </button>
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Upload .M3U</span>
            </button>
            <button
              onClick={fetchSources}
              disabled={isLoading}
              className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Refresh Sources"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. FEATURED MASTER HUBS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Core System M3U Playlists</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">Click card to Inspect &amp; Edit streams</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {masterHubs.map((hub) => {
            const isCopied = copiedKey === hub.id;
            return (
              <div
                key={hub.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all group cursor-pointer"
                onClick={() => handleOpenDetail({ id: hub.id, name: hub.name, url: hub.url, slug: hub.slug, type: 'master' })}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">{hub.icon}</div>
                      <h3 className="font-bold text-white text-xs leading-snug group-hover:text-amber-300 transition-colors">{hub.name}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${hub.badgeBg}`}>
                      {hub.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{hub.description}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 space-y-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    readOnly
                    value={hub.url}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-[10px] text-amber-300 font-mono select-all focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyToClipboard(hub.url, hub.name, hub.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied' : 'Copy M3U'}</span>
                    </button>
                    <button
                      onClick={() => handleOpenDetail({ id: hub.id, name: hub.name, url: hub.url, slug: hub.slug, type: 'master' })}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                      title="Inspect & Edit Playlist"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. INDIVIDUAL & REMOTE SOURCES GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Configured Playlist Sources ({sources.length})</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">Live Sync &amp; Full Detail Editing</span>
        </div>

        {sources.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-300 font-semibold">Loading sources...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sources.map((src) => {
              const sourceSlug = src.slug || src.id;
              const directM3uUrl = `${cleanOrigin}/${sourceSlug}.m3u`;
              const isCopied = copiedKey === src.id;

              return (
                <div
                  key={src.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all group cursor-pointer"
                  onClick={() => handleOpenDetail({ id: src.id, name: src.name, url: directM3uUrl, slug: sourceSlug, type: 'source' })}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-white text-sm truncate group-hover:text-amber-300 transition-colors">{src.name}</h3>
                          <span className="text-[11px] font-mono text-slate-400 truncate block">
                            {src.id} · {src.type}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            src.status === 'success'
                              ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50'
                              : src.status === 'error'
                              ? 'bg-rose-500'
                              : 'bg-amber-400 animate-pulse'
                          }`}
                          title={src.status}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Streams / Channels:</span>
                        <span className="font-mono font-bold text-amber-400">{src.channelCount || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Last Synced:</span>
                        <span className="font-mono text-slate-300">
                          {src.lastSyncTime ? new Date(src.lastSyncTime).toLocaleTimeString() : 'Never'}
                        </span>
                      </div>
                      <div className="truncate text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
                        {src.url}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2.5" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-mono block">Clean M3U URL:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={directM3uUrl}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-[11px] text-cyan-300 font-mono select-all focus:outline-none"
                        />
                        <button
                          onClick={() => copyToClipboard(directM3uUrl, src.name, src.id)}
                          className="flex items-center gap-1 px-3 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shrink-0"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => handleSyncSource(src.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                      >
                        <RefreshCw className="w-3 h-3 text-amber-400" />
                        <span>Sync Now</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenDetail({ id: src.id, name: src.name, url: directM3uUrl, slug: sourceSlug, type: 'source' })}
                          className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1 px-2"
                          title="Open Full Detail Webpage & Edit Streams"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Inspect / Edit</span>
                        </button>
                        <button
                          onClick={() => handleInspectJson(src)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Inspect JSON Payload"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSource(src.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition-colors"
                          title="Remove Playlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. FULL PLAYLIST DETAIL & STREAM MANAGER MODAL */}
      {detailPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/90 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono text-amber-300 uppercase font-bold">
                    {detailPlaylist.type === 'master' ? 'Master Catalog' : 'Remote Source'}
                  </span>
                  <h2 className="text-lg font-bold text-white font-mono">{detailPlaylist.name}</h2>
                </div>
                <p className="text-xs text-slate-400 font-mono truncate">{detailPlaylist.url}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => copyToClipboard(detailPlaylist.url, detailPlaylist.name, detailPlaylist.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Clean M3U Link</span>
                </button>
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = detailPlaylist.url;
                    a.download = `${detailPlaylist.slug}.m3u`;
                    a.click();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export .M3U</span>
                </button>
                <button
                  onClick={() => setShowAddStream(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Stream</span>
                </button>
                <button
                  onClick={() => setDetailPlaylist(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Controls Bar */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={channelSearch}
                  onChange={(e) => setChannelSearch(e.target.value)}
                  placeholder="Search streams by name, group or ID..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Group Selector */}
              {channelGroups.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold shrink-0">Group:</span>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="all">All Groups ({playlistChannels.length})</option>
                    {channelGroups.map((grp) => (
                      <option key={grp} value={grp.toLowerCase()}>
                        {grp}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Bulk Category Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulkLogoModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30"
                  title="Bulk apply logo image across all channels in a category"
                >
                  <Image className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bulk Category Logo</span>
                </button>

                <button
                  onClick={() => setShowRenameCategoryModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-cyan-500/30"
                  title="Rename category across all channels"
                >
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Rename Category</span>
                </button>
              </div>
            </div>

            {/* Modal Stream Channel Table */}
            <div className="p-4 flex-1 overflow-y-auto bg-slate-950/60 space-y-2">
              {isLoadingChannels ? (
                <div className="text-center py-16">
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Fetching stream items...</p>
                </div>
              ) : filteredChannels.length === 0 ? (
                <div className="text-center py-16">
                  <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No channels found in this playlist view.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredChannels.map((ch, idx) => {
                    const name = ch.customName || ch.title || ch.name || 'Unnamed Stream';
                    const grp = ch.customGroup || ch.groupTitle || ch.category || ch.categoryName || 'General';
                    const logo = ch.customLogo || ch.logo;
                    const url = ch.customUrl || ch.uri || ch.url || '';

                    return (
                      <div
                        key={ch.id || idx}
                        className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                            {logo ? (
                              <img src={logo} alt={name} className="w-full h-full object-contain" onError={(e) => ((e.target as HTMLElement).style.display = 'none')} />
                            ) : (
                              <Tv className="w-5 h-5 text-slate-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate">{name}</h4>
                            <span className="inline-block px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono mt-1">
                              {grp}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-[10px] font-mono text-slate-400 truncate">
                          {url}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                          <button
                            onClick={() => copyToClipboard(url, name, `ch-${ch.id || idx}`)}
                            className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-mono"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy Stream URL</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingChannel({ ...ch, name, group: grp, logo, url })}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-amber-500 text-slate-300 hover:text-slate-950 transition-colors"
                              title="Edit Stream Properties"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteChannel(ch.id, name)}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition-colors"
                              title="Delete Stream"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SINGLE CHANNEL */}
      {editingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-mono">Edit Stream Properties</h3>
              </div>
              <button onClick={() => setEditingChannel(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Stream Title / Channel Name</label>
                <input
                  type="text"
                  value={editingChannel.customName || editingChannel.name || editingChannel.title || ''}
                  onChange={(e) => setEditingChannel({ ...editingChannel, customName: e.target.value, name: e.target.value, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Category / Group Title</label>
                <input
                  type="text"
                  value={editingChannel.customGroup || editingChannel.groupTitle || editingChannel.category || ''}
                  onChange={(e) => setEditingChannel({ ...editingChannel, customGroup: e.target.value, groupTitle: e.target.value, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Stream URL</label>
                <input
                  type="text"
                  value={editingChannel.customUrl || editingChannel.uri || editingChannel.url || ''}
                  onChange={(e) => setEditingChannel({ ...editingChannel, customUrl: e.target.value, uri: e.target.value, url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Logo Image URL</label>
                <input
                  type="text"
                  value={editingChannel.customLogo || editingChannel.logo || ''}
                  onChange={(e) => setEditingChannel({ ...editingChannel, customLogo: e.target.value, logo: e.target.value })}
                  placeholder="https://.../logo.png"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setEditingChannel(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">
                Cancel
              </button>
              <button onClick={handleSaveChannel} className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-md">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM STREAM */}
      {showAddStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-mono">Add Custom Stream / Channel</h3>
              </div>
              <button onClick={() => setShowAddStream(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomStream} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Channel / Stream Name</label>
                <input
                  type="text"
                  required
                  value={newStreamData.name}
                  onChange={(e) => setNewStreamData({ ...newStreamData, name: e.target.value })}
                  placeholder="e.g. Willow Cricket HD"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Category / Group Title</label>
                <input
                  type="text"
                  required
                  value={newStreamData.group}
                  onChange={(e) => setNewStreamData({ ...newStreamData, group: e.target.value })}
                  placeholder="e.g. Sports, Live Events, Entertainment"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Stream URL (M3U8 / HTTP)</label>
                <input
                  type="url"
                  required
                  value={newStreamData.url}
                  onChange={(e) => setNewStreamData({ ...newStreamData, url: e.target.value })}
                  placeholder="https://.../stream.m3u8"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Logo Image URL (Optional)</label>
                <input
                  type="url"
                  value={newStreamData.logo}
                  onChange={(e) => setNewStreamData({ ...newStreamData, logo: e.target.value })}
                  placeholder="https://.../logo.png"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddStream(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold shadow-md">
                  Add Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BULK SET CATEGORY LOGO */}
      {showBulkLogoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-mono">Bulk Set Category Logo</h3>
              </div>
              <button onClick={() => setShowBulkLogoModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyBulkCategoryLogo} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Select Category / Group Name</label>
                <select
                  value={targetBulkCategory}
                  onChange={(e) => setTargetBulkCategory(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="">Select a Category...</option>
                  {channelGroups.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">New Category Logo URL</label>
                <input
                  type="url"
                  required
                  value={bulkLogoUrl}
                  onChange={(e) => setBulkLogoUrl(e.target.value)}
                  placeholder="https://.../category-logo.png"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowBulkLogoModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-md">
                  Apply Logo to Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RENAME CATEGORY */}
      {showRenameCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono">Rename Category</h3>
              </div>
              <button onClick={() => setShowRenameCategoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenameCategory} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Current Category Name</label>
                <select
                  value={categoryOldName}
                  onChange={(e) => setCategoryOldName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="">Select Existing Category...</option>
                  {channelGroups.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">New Category Name</label>
                <input
                  type="text"
                  required
                  value={categoryNewName}
                  onChange={(e) => setCategoryNewName(e.target.value)}
                  placeholder="e.g. VIP Sports, Live Cinema, News & World"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowRenameCategoryModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold shadow-md">
                  Rename Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. JSON INSPECTOR MODAL */}
      {selectedPlaylistJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">JSON Payload: {selectedPlaylistJson.name}</h3>
              </div>
              <button
                onClick={() => setSelectedPlaylistJson(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800"
              >
                Close
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto bg-slate-950 font-mono text-[11px] text-cyan-300">
              <pre>{JSON.stringify(selectedPlaylistJson.data, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


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
  Edit2,
  Trash2,
  Plus,
  X,
  Image,
  FolderInput
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
  const [activeServerTab, setActiveServerTab] = useState<'all' | 'server1' | 'server2'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [editingItem, setEditingItem] = useState<SportsEventItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkLogoModal, setShowBulkLogoModal] = useState(false);

  // Form states
  const [newItem, setNewItem] = useState({ title: '', category: 'Cricket & Sports', logo: '', url: '' });
  const [bulkLogoData, setBulkLogoData] = useState({ categoryName: '', logoUrl: '' });

  const cleanBase = publicBaseUrl ? publicBaseUrl.replace(':8443', '').replace(':3000', '') : getCleanOrigin();
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

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const res = await fetch(`/api/events/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingItem.title,
          category: editingItem.category,
          logo: editingItem.logo,
          url: editingItem.url,
        }),
      });
      if (res.ok) {
        onNotify('success', 'FanCode Stream Updated');
        setEditingItem(null);
        fetchEvents();
      }
    } catch {
      onNotify('error', 'Failed to update stream');
    }
  };

  const handleDeleteStream = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stream?')) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onNotify('success', 'Stream Removed');
        fetchEvents();
      }
    } catch {
      onNotify('error', 'Failed to delete stream');
    }
  };

  const handleAddStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title || !newItem.url) {
      onNotify('error', 'Title and Stream URL are required');
      return;
    }
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newItem,
          service: 'fancode',
        }),
      });
      if (res.ok) {
        onNotify('success', 'Stream Added to FanCode');
        setShowAddModal(false);
        setNewItem({ title: '', category: 'Cricket & Sports', logo: '', url: '' });
        fetchEvents();
      }
    } catch {
      onNotify('error', 'Failed to add stream');
    }
  };

  const handleBulkLogoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkLogoData.categoryName || !bulkLogoData.logoUrl) {
      onNotify('error', 'Category Name and Logo URL required');
      return;
    }
    try {
      const res = await fetch('/api/events/bulk-category-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'fancode',
          categoryName: bulkLogoData.categoryName,
          logoUrl: bulkLogoData.logoUrl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onNotify('success', `Applied Logo across ${data.count || 0} streams in ${bulkLogoData.categoryName}`);
        setShowBulkLogoModal(false);
        fetchEvents();
      }
    } catch {
      onNotify('error', 'Failed to apply category logo');
    }
  };

  const categories = Array.from(new Set(events.map((e) => e.category || e.sport || 'Cricket & Sports').filter(Boolean)));

  const filteredEvents = events.filter((e) => {
    const matchesServer = activeServerTab === 'all' || e.serverId === activeServerTab || !e.serverId;

    const matchesSearch =
      (e.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.sport || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSport =
      selectedSport === 'all' || (e.sport || e.category || '').toLowerCase() === selectedSport.toLowerCase();

    return matchesServer && matchesSearch && matchesSport;
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
                <span className="text-[11px] text-slate-400">Dual-Server Hybrid Fetcher (7m)</span>
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
              onClick={() => copyToClipboard(m3uUrl, 'FanCode M3U URL', 'fancode_m3u')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              {copiedKey === 'fancode_m3u' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey === 'fancode_m3u' ? 'Copied M3U' : 'Copy FanCode M3U'}</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Stream</span>
            </button>

            <button
              onClick={() => setShowBulkLogoModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all"
              title="Apply a logo URL to all streams in a category"
            >
              <Image className="w-4 h-4 text-cyan-400" />
              <span>Category Logo</span>
            </button>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              title="Sync latest FanCode matches"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Top Server Selection Sub-Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl">
        <span className="text-[11px] font-mono text-slate-400 font-bold uppercase px-2 shrink-0">FanCode Servers:</span>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveServerTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeServerTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            All Servers ({events.length})
          </button>
          <button
            onClick={() => setActiveServerTab('server1')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeServerTab === 'server1'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            Server 1 (ZyphX)
          </button>
          <button
            onClick={() => setActiveServerTab('server2')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeServerTab === 'server2'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            Server 2 (DRMLive)
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search match title, category or tournament..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedSport('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              selectedSport === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Sports ({events.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedSport(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedSport.toLowerCase() === cat.toLowerCase()
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800/80">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-300">Fetching live FanCode events &amp; matches...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80">
          <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No FanCode Events Found</h3>
          <p className="text-xs text-slate-400 mt-1">Try searching a different match or sync fresh data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((item) => {
            const isLive = item.status === 'LIVE' || (item.title || '').toLowerCase().includes('live');
            const streamUrl = item.url;

            return (
              <div
                key={item.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                        <img
                          src={item.logo || item.poster}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                              isLive ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {isLive ? '• LIVE' : 'UPCOMING'}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">{item.category}</span>
                        </div>
                        <h3 className="font-bold text-white text-sm truncate mt-1">{item.title}</h3>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1.5 font-mono text-[11px]">
                    <span className="text-slate-400 block text-[10px]">Stream URL:</span>
                    <div className="truncate text-cyan-300">{streamUrl || 'No playable stream link found'}</div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {streamUrl && (
                      <button
                        onClick={() =>
                          onPreviewChannel({
                            id: item.id,
                            name: item.title,
                            url: streamUrl,
                            tvgLogo: item.logo,
                            groupTitle: item.category,
                          })
                        }
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Watch</span>
                      </button>
                    )}

                    {streamUrl && (
                      <button
                        onClick={() => copyToClipboard(streamUrl, item.title, item.id)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Copy Stream Link"
                      >
                        {copiedKey === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Edit Stream"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteStream(item.id)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition-colors"
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

      {/* EDIT STREAM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Edit FanCode Stream</span>
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Title / Match Name</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category / Group</label>
                <input
                  type="text"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Logo URL</label>
                <input
                  type="text"
                  value={editingItem.logo}
                  onChange={(e) => setEditingItem({ ...editingItem, logo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Stream URL</label>
                <input
                  type="text"
                  value={editingItem.url}
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Stream Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STREAM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Stream to FanCode</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStream} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Title / Event Name</label>
                <input
                  type="text"
                  placeholder="e.g. India vs Australia T20 Live"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category / Group</label>
                <input
                  type="text"
                  placeholder="Cricket & Sports"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Logo URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newItem.logo}
                  onChange={(e) => setNewItem({ ...newItem, logo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Stream URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newItem.url}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Add Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK CATEGORY LOGO MODAL */}
      {showBulkLogoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                <Image className="w-4 h-4 text-cyan-400" />
                <span>Bulk Apply Category Logo</span>
              </h3>
              <button onClick={() => setShowBulkLogoModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkLogoSubmit} className="space-y-3.5 text-xs">
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Apply a specific channel/category logo URL to ALL streams inside a selected category in one click.
              </p>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Category</label>
                <select
                  value={bulkLogoData.categoryName}
                  onChange={(e) => setBulkLogoData({ ...bulkLogoData, categoryName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Logo URL to Apply</label>
                <input
                  type="text"
                  placeholder="https://ik.imagekit.io/..."
                  value={bulkLogoData.logoUrl}
                  onChange={(e) => setBulkLogoData({ ...bulkLogoData, logoUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkLogoModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Apply Logo Across Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

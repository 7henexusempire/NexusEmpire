/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  Tv
} from 'lucide-react';
import { PlaylistSource } from '../types';
import { getCleanOrigin } from '../utils/urlUtils';

interface PlaylistsViewProps {
  onNotify: (type: 'success' | 'error' | 'info', message: string, details?: string) => void;
  onOpenSources: () => void;
  onOpenUpload: () => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({ onNotify, onOpenSources, onOpenUpload }) => {
  const [sources, setSources] = useState<PlaylistSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedPlaylistJson, setSelectedPlaylistJson] = useState<{ name: string; data: any } | null>(null);

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

  const handleSyncSource = async (id: string) => {
    try {
      onNotify('info', 'Syncing Playlist...', 'Fetching fresh streams from remote source');
      const res = await fetch(`/api/sync?sourceId=${encodeURIComponent(id)}`, { method: 'POST' });
      if (res.ok) {
        onNotify('success', 'Playlist Synced Successfully!');
        fetchSources();
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
      }
    } catch (err: any) {
      onNotify('error', 'Failed to remove source', err.message);
    }
  };

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
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

  const masterHubs = [
    {
      id: 'master-all',
      name: 'Master Combined M3U',
      url: `${cleanOrigin}/playlist.m3u`,
      icon: <Radio className="w-5 h-5 text-amber-400" />,
      badge: 'ALL IN ONE',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Unified M3U containing all active streams, channels & live sources with zero duplicates.',
    },
    {
      id: 'nexusempire-vip',
      name: 'Nexus Empire VIP Catalog',
      url: `${cleanOrigin}/nexusempire/all.m3u`,
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      badge: 'VIP NATIVE',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'AniTv & StreamBox native catalog with Willow, Sony, Live Events and adult streams.',
    },
    {
      id: 'fancode-hub',
      name: 'FanCode Live Sports M3U',
      url: `${cleanOrigin}/fancode.m3u`,
      icon: <Trophy className="w-5 h-5 text-amber-400" />,
      badge: 'FANCODE',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Live Cricket, EPL, Football and Tournament streams updated every 7 mins.',
    },
    {
      id: 'sonyliv-hub',
      name: 'SonyLIV Network & Sports M3U',
      url: `${cleanOrigin}/sonyliv.m3u`,
      icon: <Tv className="w-5 h-5 text-indigo-400" />,
      badge: 'SONY LIV',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      description: 'Sony Ten 1/2/3/4/5 HD, Sony SAB HD & Live Sports events.',
    },
    {
      id: 'zee5-hub',
      name: 'Zee5 Live Channels M3U',
      url: `${cleanOrigin}/zee5.m3u`,
      icon: <Radio className="w-5 h-5 text-cyan-400" />,
      badge: 'ZEE5',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      description: 'Zee TV, Zee Cinema, Regional Channels & Live Feeds.',
    },
    {
      id: 'cloudstream-hub',
      name: 'CloudStream Extension Relay',
      url: `${cleanOrigin}/cloudstream.m3u`,
      icon: <Flame className="w-5 h-5 text-orange-400" />,
      badge: 'CLOUDSTREAM',
      badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      description: 'Cricfy Live, SKTech and CloudStream extension repository feeds.',
    },
    {
      id: 'skystream-hub',
      name: 'SkyStream Global M3U',
      url: `${cleanOrigin}/skystream.m3u`,
      icon: <Globe className="w-5 h-5 text-amber-300" />,
      badge: 'SKYSTREAM',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Sky Sports, TNT, Willow and global satellite relays.',
    },
    {
      id: 'stremio-hub',
      name: 'Nuvio & Stremio Addons M3U',
      url: `${cleanOrigin}/stremio.m3u`,
      icon: <RadioTower className="w-5 h-5 text-yellow-400" />,
      badge: 'STREMIO',
      badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      description: 'Stremio addon feeds, CyberFlix, Torrentio & Nuvio bridge.',
    },
  ];

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
                Live Directory
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Complete directory of all M3U playlists, PHP feeds, Cloudflare Workers, and JSON endpoints. All URLs are formatted cleanly without port numbers for 100% compatibility with TiviMate, OTT Navigator &amp; Kodi.
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
          <span className="text-xs text-slate-400 font-mono">OTT Navigator &amp; TiviMate Ready</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {masterHubs.map((hub) => {
            const isCopied = copiedKey === hub.id;
            return (
              <div
                key={hub.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">{hub.icon}</div>
                      <h3 className="font-bold text-white text-xs leading-snug">{hub.name}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${hub.badgeBg}`}>
                      {hub.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{hub.description}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 space-y-2">
                  <input
                    type="text"
                    readOnly
                    value={hub.url}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-[10px] text-amber-300 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(hub.url, hub.name, hub.id)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied M3U URL' : 'Copy M3U Link'}</span>
                  </button>
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
          <span className="text-xs text-slate-400 font-mono">Live Sync Status</span>
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
              const apiM3uUrl = `${cleanOrigin}/api/playlist/${sourceSlug}.m3u`;
              const isCopied = copiedKey === src.id;

              return (
                <div
                  key={src.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-white text-sm truncate">{src.name}</h3>
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

                  <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2.5">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-mono block">Direct M3U URL:</span>
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

      {/* 4. JSON INSPECTOR MODAL */}
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

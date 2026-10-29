import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Check,
  Copy,
  Trash2,
  Undo2,
  Search,
  Layers,
  Globe,
  Radio,
  Tv,
  Info,
  Zap,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { getCleanOrigin } from '../utils/urlUtils';

export interface DuplicateReportItem {
  id: string;
  name: string;
  originalName: string;
  group: string;
  sourceId: string;
  sourceName?: string;
  url: string;
  normalizedUrl: string;
  clearKeySnippet?: string;
  reason: string;
  primaryChannelId?: string;
  primaryChannelName?: string;
  primaryChannelUrl?: string;
  primaryChannelSource?: string;
  primaryChannelGroup?: string;
  isRestored?: boolean;
}

interface DuplicateViewProps {
  onNotify: (type: 'success' | 'error' | 'info' | 'loading', title: string, message?: string) => void;
  onPreviewChannel?: (ch: any) => void;
}

export const DuplicateView: React.FC<DuplicateViewProps> = ({ onNotify, onPreviewChannel }) => {
  const [duplicates, setDuplicates] = useState<DuplicateReportItem[]>([]);
  const [fuzzyCandidates, setFuzzyCandidates] = useState<DuplicateReportItem[]>([]);
  const [restoredIds, setRestoredIds] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalRaw: 0,
    exactDuplicatesRemoved: 0,
    distinctVariantsPreserved: 0,
    restoredCount: 0,
    finalCleanChannels: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedReason, setSelectedReason] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'filtered' | 'restored'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const cleanOrigin = getCleanOrigin();

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/duplicates');
      if (res.ok) {
        const data = await res.json();
        setDuplicates(data.duplicates || []);
        setFuzzyCandidates(data.fuzzyCandidates || []);
        setRestoredIds(data.restoredIds || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err: any) {
      console.error('Failed to load duplicate report:', err);
      onNotify('error', 'Report Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleRestoreStream = async (channelId: string, channelName: string) => {
    try {
      const res = await fetch('/api/duplicates/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelIds: [channelId] }),
      });
      if (res.ok) {
        onNotify('success', 'Stream Restored!', `"${channelName}" is now re-included in active M3U playlists.`);
        fetchReport();
      }
    } catch (err: any) {
      onNotify('error', 'Restore Failed', err.message);
    }
  };

  const handleUnrestoreStream = async (channelId: string, channelName: string) => {
    try {
      const res = await fetch('/api/duplicates/unrestore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelIds: [channelId] }),
      });
      if (res.ok) {
        onNotify('info', 'Stream Filtered', `"${channelName}" deduplication re-applied.`);
        fetchReport();
      }
    } catch (err: any) {
      onNotify('error', 'Action Failed', err.message);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('/api/duplicates/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelIds: selectedIds }),
      });
      if (res.ok) {
        onNotify('success', 'Bulk Restore Complete', `Restored ${selectedIds.length} streams to active playlists.`);
        setSelectedIds([]);
        fetchReport();
      }
    } catch (err: any) {
      onNotify('error', 'Bulk Restore Failed', err.message);
    }
  };

  const handleRunAiScanner = async () => {
    setIsAiScanning(true);
    onNotify('loading', 'AI Deduplicator Active', 'Scanning titles & token similarities across all playlists...');
    try {
      const res = await fetch('/api/duplicates/ai-clean', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setFuzzyCandidates(data.fuzzyCandidates || []);
        onNotify('success', 'AI Scan Complete!', `Found ${data.fuzzyCount || 0} fuzzy similarity stream candidates.`);
        fetchReport();
      }
    } catch (err: any) {
      onNotify('error', 'AI Scan Error', err.message);
    } finally {
      setIsAiScanning(false);
    }
  };

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onNotify('success', `Copied ${label}!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Filter options lists
  const sourceOptions = useMemo(() => {
    const set = new Set<string>();
    duplicates.forEach((d) => {
      if (d.sourceName || d.sourceId) set.add(d.sourceName || d.sourceId);
    });
    return Array.from(set).sort();
  }, [duplicates]);

  const reasonOptions = useMemo(() => {
    const set = new Set<string>();
    duplicates.forEach((d) => {
      if (d.reason) set.add(d.reason);
    });
    return Array.from(set).sort();
  }, [duplicates]);

  // Filtered duplicates
  const filteredDuplicates = useMemo(() => {
    return duplicates.filter((d) => {
      const isRestored = restoredIds.includes(d.id);

      const matchesSearch =
        !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.group.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.primaryChannelName && d.primaryChannelName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSource =
        selectedSource === 'all' ||
        (d.sourceName || d.sourceId).toLowerCase() === selectedSource.toLowerCase();

      const matchesReason =
        selectedReason === 'all' || d.reason.toLowerCase() === selectedReason.toLowerCase();

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'restored' && isRestored) ||
        (selectedStatus === 'filtered' && !isRestored);

      return matchesSearch && matchesSource && matchesReason && matchesStatus;
    });
  }, [duplicates, restoredIds, searchQuery, selectedSource, selectedReason, selectedStatus]);

  const isAllSelected =
    filteredDuplicates.length > 0 &&
    filteredDuplicates.every((d) => selectedIds.includes(d.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDuplicates.map((d) => d.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. GLASSMORPHIC HERO DASHBOARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/90 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI DEDUPLICATION &amp; STREAM RECOVERY HUB</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-[10px] font-mono text-amber-300">
                100% Zero-Loss Stream Guard
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2 font-mono">
              <span>AI Duplicate Removal Report</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Complete diagnostic report of duplicate streams identified across all M3U sources and category bouquets. Easily inspect original sources, review duplicate causes, and recover any stream back into your live playlist!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleRunAiScanner}
              disabled={isAiScanning}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isAiScanning ? 'animate-spin' : ''}`} />
              <span>{isAiScanning ? 'Scanning...' : 'Push AI Duplicate Cleaner'}</span>
            </button>
            <button
              onClick={fetchReport}
              disabled={isLoading}
              className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Refresh Duplicate Report"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] text-slate-400 font-mono block">Raw Channels Analyzed</span>
            <span className="text-xl font-bold font-mono text-white">{stats.totalRaw}</span>
          </div>

          <div className="bg-slate-950/60 border border-emerald-500/30 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] text-emerald-400 font-mono block">Duplicates Filtered</span>
            <span className="text-xl font-bold font-mono text-emerald-300">{stats.exactDuplicatesRemoved}</span>
          </div>

          <div className="bg-slate-950/60 border border-amber-500/30 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] text-amber-400 font-mono block">Streams Restored / Recovered</span>
            <span className="text-xl font-bold font-mono text-amber-300">{restoredIds.length}</span>
          </div>

          <div className="bg-slate-950/60 border border-indigo-500/30 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] text-indigo-400 font-mono block">AI Fuzzy Similarity Matches</span>
            <span className="text-xl font-bold font-mono text-indigo-300">{fuzzyCandidates.length}</span>
          </div>
        </div>
      </div>

      {/* 2. AI FUZZY MATCHES BANNER */}
      {fuzzyCandidates.length > 0 && (
        <div className="bg-slate-900/90 border border-indigo-500/40 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white font-mono">
                AI Detected Fuzzy Similarity Candidates ({fuzzyCandidates.length})
              </h3>
            </div>
            <span className="text-xs text-indigo-300 font-mono">Similarity &gt; 82%</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {fuzzyCandidates.slice(0, 6).map((item, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white truncate">{item.name}</h4>
                    <span className="text-[10px] font-mono text-indigo-300">{item.reason}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[9px] font-mono">
                    {item.group}
                  </span>
                </div>

                <div className="bg-slate-900 rounded-xl p-2 text-[10px] text-slate-400 space-y-1 font-mono">
                  <div className="truncate">Source: <span className="text-slate-200">{item.sourceName || item.sourceId}</span></div>
                  <div className="truncate">Matches: <span className="text-amber-300">{item.primaryChannelName}</span></div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleRestoreStream(item.id, item.name)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold"
                  >
                    Keep Stream
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SEARCH & CONTROLS TOOLBAR */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search duplicate stream titles, categories, primary sources..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
            />
          </div>

          {/* Source Dropdown */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Source Playlists</option>
              {sourceOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Reason Dropdown */}
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Causes</option>
              {reasonOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Status Selector */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-2xl text-xs">
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  selectedStatus === 'all' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedStatus('filtered')}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  selectedStatus === 'filtered' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Filtered
              </button>
              <button
                onClick={() => setSelectedStatus('restored')}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  selectedStatus === 'restored' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Restored ({restoredIds.length})
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Selection Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between gap-4 animate-fadeIn">
            <span className="text-xs font-mono font-bold text-amber-300">
              {selectedIds.length} stream duplicates selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkRestore}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Recover / Restore Selected</span>
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Deselect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. DUPLICATES GRID / LIST */}
      {isLoading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-300 font-semibold">Analyzing stream deduplication records...</p>
        </div>
      ) : filteredDuplicates.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Zero Stream Duplicates Found</h3>
          <p className="text-xs text-slate-400">Your live streams are 100% optimized and clean.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
              />
              <span>Showing {filteredDuplicates.length} stream duplicate records</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDuplicates.map((item) => {
              const isRestored = restoredIds.includes(item.id);
              const isSelected = selectedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`bg-slate-900/90 border rounded-3xl p-4 flex flex-col justify-between gap-3 shadow-xl transition-all ${
                    isRestored
                      ? 'border-amber-500/50 bg-amber-950/10'
                      : isSelected
                      ? 'border-emerald-500/60'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-white text-xs truncate">{item.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400 block truncate">
                            Category: <span className="text-emerald-300 font-semibold">{item.group}</span>
                          </span>
                        </div>
                      </div>

                      {isRestored ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold shrink-0">
                          RESTORED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono shrink-0">
                          FILTERED
                        </span>
                      )}
                    </div>

                    {/* Metadata Detail Card */}
                    <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 space-y-2 text-[11px] font-mono">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Source Playlist:</span>
                        <span className="text-amber-300 font-bold truncate max-w-[140px]">
                          {item.sourceName || item.sourceId}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Deduplication Cause:</span>
                        <span className="text-slate-200 truncate max-w-[140px]">{item.reason}</span>
                      </div>

                      {item.primaryChannelName && (
                        <div className="pt-2 border-t border-slate-900 space-y-1">
                          <span className="text-[10px] text-slate-500 block">Primary Stream Kept:</span>
                          <div className="text-[10px] text-cyan-300 font-bold truncate">
                            {item.primaryChannelName} ({item.primaryChannelGroup || 'Main'})
                          </div>
                        </div>
                      )}

                      <div className="truncate text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                        {item.url}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => copyToClipboard(item.url, 'Stream URL', `url-${item.id}`)}
                      className="text-[10px] text-slate-400 hover:text-white font-mono flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy URL</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {isRestored ? (
                        <button
                          onClick={() => handleUnrestoreStream(item.id, item.name)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                        >
                          <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Re-filter</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestoreStream(item.id, item.name)}
                          className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          <span>Recover Stream</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

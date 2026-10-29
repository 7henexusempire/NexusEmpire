import React, { useState } from 'react';
import { ChannelStream, DuplicateCluster } from '../types/playlist';
import {
  Trash2,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Server,
  Layers,
  CheckCircle2,
  Play,
  XCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface AiDeduplicationTabProps {
  channels: ChannelStream[];
  onPlayStream: (stream: ChannelStream) => void;
  onSendToTrash: (channelId: string) => void;
  onRestoreFromTrash: (channelId: string) => void;
  onEmptyTrash: () => void;
  onBulkQuarantine: (duplicateIds: string[]) => void;
}

export const AiDeduplicationTab: React.FC<AiDeduplicationTabProps> = ({
  channels,
  onPlayStream,
  onSendToTrash,
  onRestoreFromTrash,
  onEmptyTrash,
  onBulkQuarantine,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'scan' | 'trash'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [useAi, setUseAi] = useState(true);
  const [clusters, setClusters] = useState<DuplicateCluster[]>([]);
  const [scanSummary, setScanSummary] = useState<{
    totalChecked: number;
    duplicateCount: number;
    alternateServerCount: number;
  } | null>(null);

  const channelMap = new Map<string, ChannelStream>(channels.map((c) => [c.id, c]));
  const trashedChannels = channels.filter((c) => c.status === 'trashed');

  const runScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/ai/deduplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useAiModel: useAi }),
      });
      const data = await res.json();
      setClusters(data.clusters || []);
      setScanSummary(data.summary || null);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleQuarantineAll = () => {
    const allDupIds = clusters.flatMap((c) => c.duplicateIds);
    if (allDupIds.length === 0) return;
    onBulkQuarantine(allDupIds);
    // clear or update scanned list
    setClusters([]);
    setScanSummary((prev) => prev ? { ...prev, duplicateCount: 0 } : null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="crystal-panel rounded-xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              AI Intelligent Deduplication & Quarantine Trash
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-2xl">
              Unlike primitive name matchers, Nexus AI inspects stream URLs, server hostnames, tokens, and CDN signatures.
              If a channel exists on different backup servers or alternate CDNs, <strong>it is preserved</strong> so you don't lose live mirrors.
            </p>
          </div>

          {/* Subtab Toggle Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-black/60 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setActiveSubTab('scan')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'scan'
                  ? 'bg-amber-500 text-gray-950 shadow-md'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Scanner</span>
              {scanSummary && scanSummary.duplicateCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/30 text-xs">
                  {scanSummary.duplicateCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveSubTab('trash')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'trash'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Quarantine Trash</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
                {trashedChannels.length}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* SCANNER VIEW */}
      {activeSubTab === 'scan' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="crystal-panel rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAi}
                  onChange={(e) => setUseAi(e.target.checked)}
                  className="rounded bg-black border-white/20 text-amber-500 focus:ring-0"
                />
                <span>Enable Gemini Deep Stream Analysis</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={runScan}
                disabled={isScanning}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 transition-all shadow-md active:scale-95"
              >
                <Sparkles className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Analyzing Streams...' : 'Run AI Deduplication Scan'}</span>
              </button>

              {clusters.length > 0 && (
                <button
                  onClick={handleQuarantineAll}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Quarantine Redundant Duplicates</span>
                </button>
              )}
            </div>
          </div>

          {/* Results Summary Box */}
          {scanSummary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="crystal-panel-subtle p-3 rounded-lg border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-400">Total Analyzed</span>
                  <p className="text-base font-bold font-mono text-cyan-300">
                    {scanSummary.totalChecked} streams
                  </p>
                </div>
                <Layers className="w-5 h-5 text-cyan-400 opacity-60" />
              </div>

              <div className="crystal-panel-subtle p-3 rounded-lg border border-rose-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-400">Exact Same-Server Duplicates</span>
                  <p className="text-base font-bold font-mono text-rose-400">
                    {scanSummary.duplicateCount} redundant
                  </p>
                </div>
                <AlertTriangle className="w-5 h-5 text-rose-400 opacity-60" />
              </div>

              <div className="crystal-panel-subtle p-3 rounded-lg border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-400">Alternate Server Mirrors</span>
                  <p className="text-base font-bold font-mono text-emerald-300">
                    {scanSummary.alternateServerCount} preserved
                  </p>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-400 opacity-60" />
              </div>
            </div>
          )}

          {/* Clusters List */}
          <div className="space-y-3">
            {clusters.length === 0 ? (
              <div className="crystal-panel rounded-xl p-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="font-bold text-white text-sm">
                  {scanSummary ? 'All Streams Unique or Verified Server Mirrors' : 'Ready to Run Deduplication Scan'}
                </h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  {scanSummary
                    ? 'No redundant exact-server streams detected. Alternate CDN mirrors remain safely active.'
                    : 'Click "Run AI Deduplication Scan" above to inspect all loaded playlists.'}
                </p>
              </div>
            ) : (
              clusters.map((cluster) => {
                const canonical = channelMap.get(cluster.canonicalId);
                const duplicateChannels = cluster.duplicateIds
                  .map((id) => channelMap.get(id))
                  .filter(Boolean) as ChannelStream[];

                return (
                  <div
                    key={cluster.clusterId}
                    className="crystal-panel rounded-xl p-4 border border-white/10 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{cluster.channelName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {duplicateChannels.length} Redundant Duplicates
                        </span>
                      </div>
                      <p className="text-[11px] text-cyan-300/90 font-mono">
                        {cluster.reason}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {/* Primary Canonical Stream (Kept Active) */}
                      {canonical && (
                        <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-gray-950">
                              PRIMARY KEEP
                            </span>
                            <span className="font-semibold text-white truncate">{canonical.title}</span>
                            <span className="text-gray-400 font-mono text-[10px] truncate">{canonical.url}</span>
                          </div>
                          <button
                            onClick={() => onPlayStream(canonical)}
                            className="p-1 rounded bg-black/40 text-emerald-300 hover:text-white"
                            title="Test Primary Stream"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </div>
                      )}

                      {/* Duplicates to Quarantine */}
                      {duplicateChannels.map((dup) => (
                        <div
                          key={dup.id}
                          className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/20 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-500/40">
                              DUPLICATE
                            </span>
                            <span className="text-gray-200 truncate">{dup.title}</span>
                            <span className="text-gray-400 font-mono text-[10px] truncate">{dup.url}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onPlayStream(dup)}
                              className="p-1 rounded bg-black/40 text-gray-300 hover:text-white"
                              title="Test Stream"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <button
                              onClick={() => onSendToTrash(dup.id)}
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                            >
                              Trash
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TRASH & RECOVERY VIEW */}
      {activeSubTab === 'trash' && (
        <div className="space-y-4">
          <div className="crystal-panel rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                Quarantined Streams Bin ({trashedChannels.length})
              </h3>
              <p className="text-[11px] text-gray-400">
                Streams moved here are excluded from live M3U endpoints but can be restored at any time.
              </p>
            </div>

            {trashedChannels.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    trashedChannels.forEach((c) => onRestoreFromTrash(c.id));
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore All to Active</span>
                </button>

                <button
                  onClick={onEmptyTrash}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Permanently Empty Trash</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {trashedChannels.length === 0 ? (
              <div className="crystal-panel rounded-xl p-8 text-center space-y-1">
                <p className="text-gray-300 text-sm font-semibold">Trash is empty</p>
                <p className="text-gray-400 text-xs">No streams currently quarantined.</p>
              </div>
            ) : (
              trashedChannels.map((stream) => (
                <div
                  key={stream.id}
                  className="crystal-panel-subtle p-3 rounded-lg flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 font-bold line-through">{stream.title}</span>
                      <span className="text-[10px] text-gray-400 font-mono px-1.5 rounded bg-black/40">
                        {stream.sourceName}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                      {stream.url}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPlayStream(stream)}
                      className="p-1.5 rounded bg-black/40 hover:bg-black/70 text-gray-300"
                      title="Preview Stream"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      onClick={() => onRestoreFromTrash(stream.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Recover</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

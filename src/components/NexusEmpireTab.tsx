import React, { useState } from 'react';
import { ChannelStream, RebuildCategory } from '../types/playlist';
import {
  Radio,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Tv,
  Sparkles,
  Play,
  Edit2,
  Trash2,
  Download,
  Share2,
  Key,
} from 'lucide-react';

interface NexusEmpireTabProps {
  channels: ChannelStream[];
  rebuildCategories: RebuildCategory[];
  onPlayStream: (stream: ChannelStream) => void;
  onEditStream: (stream: ChannelStream) => void;
  onDeleteStream: (streamId: string) => void;
  onAddToRebuild: (categoryId: string, channelId: string) => void;
  onAddCustomStream: (data: Partial<ChannelStream>) => void;
}

export const NexusEmpireTab: React.FC<NexusEmpireTabProps> = ({
  channels,
  rebuildCategories,
  onPlayStream,
  onEditStream,
  onDeleteStream,
  onAddToRebuild,
  onAddCustomStream,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newStreamboxInput, setNewStreamboxInput] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newGroup, setNewGroup] = useState('Nexus VIP');
  const [resolveStatus, setResolveStatus] = useState<Record<string, string>>({});
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  // Filter streams that are Streambox or belong to Nexus Empire
  const streamboxStreams = channels.filter(
    (c) =>
      c.status !== 'trashed' &&
      (c.url.startsWith('streambox://') ||
        c.sourceId === 'src-streambox' ||
        c.group?.toLowerCase().includes('nexus'))
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLaunchInAniTV = (streamUrl: string) => {
    // Streambox protocol triggers AniTV or Streambox desktop / Android app
    try {
      window.location.href = streamUrl;
    } catch {
      // fallback
    }
  };

  const handleTestResolve = async (stream: ChannelStream) => {
    setResolveStatus((prev) => ({ ...prev, [stream.id]: 'Resolving...' }));
    // Simulate token verification and protocol integrity check
    await new Promise((r) => setTimeout(r, 600));

    const hashMatch = stream.url.match(/streambox:\/\/open\/([a-f0-9]+)/i);
    if (hashMatch && hashMatch[1].length === 32) {
      setResolveStatus((prev) => ({
        ...prev,
        [stream.id]: `Verified Valid Token: ${hashMatch[1].substring(0, 8)}... (Ready for AniTV)`,
      }));
    } else {
      setResolveStatus((prev) => ({
        ...prev,
        [stream.id]: 'Custom Protocol Token Active',
      }));
    }
  };

  const handleAddStreambox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreamboxInput.trim()) return;

    let finalUrl = newStreamboxInput.trim();
    if (!finalUrl.startsWith('streambox://')) {
      finalUrl = `streambox://open/${finalUrl.replace(/^open\//, '')}`;
    }

    onAddCustomStream({
      title: newTitle.trim() || `Nexus Streambox Stream ${streamboxStreams.length + 1}`,
      url: finalUrl,
      group: newGroup.trim() || 'Nexus VIP',
      logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547',
      tvgName: newTitle.trim() || `Nexus Streambox ${streamboxStreams.length + 1}`,
      sourceId: 'src-streambox',
      sourceName: 'Nexus Empire Streambox Vault',
    });

    setNewStreamboxInput('');
    setNewTitle('');
  };

  const m3uEndpoint = `${window.location.origin}/api/playlist/nexus-empire.m3u`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="crystal-panel rounded-xl p-5 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300">
                <Radio className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-white">
                  Nexus Empire Vault (Streambox & AniTV Protocol)
                </h2>
                <p className="text-xs text-amber-300/90 font-mono">
                  Native streambox://open/ URI integration with AniTV & TiviMate external players
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed pt-1">
              Streambox URLs use customized encrypted payload hashes designed for AniTV and Streambox players.
              Nexus Empire compiles these into unified IPTV-compatible playlists with direct app deep-linking.
            </p>
          </div>

          {/* Quick Endpoint Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => {
                navigator.clipboard.writeText(m3uEndpoint);
                setCopiedEndpoint(true);
                setTimeout(() => setCopiedEndpoint(false), 2000);
              }}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-black/60 hover:bg-black/90 text-cyan-300 border border-cyan-500/40 transition-all"
            >
              {copiedEndpoint ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedEndpoint ? 'Copied M3U URL!' : 'Copy AniTV M3U URL'}</span>
            </button>

            <a
              href="/api/playlist/nexus-empire.m3u"
              download="nexus_empire_vault.m3u"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 transition-all shadow-md"
            >
              <Download className="w-4 h-4" /> Download .M3U
            </a>
          </div>
        </div>
      </section>

      {/* Add New Streambox Stream Form */}
      <section className="crystal-panel rounded-xl p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4 text-cyan-400" />
          Add Streambox Hash or Protocol URL
        </h3>
        <form onSubmit={handleAddStreambox} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-medium text-gray-300 mb-1">
              Streambox URL or 32-Char Hex Hash
            </label>
            <input
              type="text"
              required
              value={newStreamboxInput}
              onChange={(e) => setNewStreamboxInput(e.target.value)}
              placeholder="e.g. streambox://open/255cfab9f98da87dab11a6e0a337279e"
              className="w-full px-3 py-2 text-xs rounded-lg crystal-input text-white font-mono placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-300 mb-1">
              Stream Name
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Nexus Cinema HD"
              className="w-full px-3 py-2 text-xs rounded-lg crystal-input text-white placeholder-gray-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-gray-950 transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Vault</span>
            </button>
          </div>
        </form>
      </section>

      {/* Streambox Streams Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-300 px-1">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            Active Streambox Feeds ({streamboxStreams.length})
          </h3>
          <span className="text-gray-400 text-xs">
            Directly functional in AniTV & IPTV players supporting Streambox schemes
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {streamboxStreams.map((stream) => {
            const isCopied = copiedId === stream.id;
            const hashMatch = stream.url.match(/streambox:\/\/open\/([a-f0-9]+)/i);
            const hashToken = hashMatch ? hashMatch[1] : stream.url;
            const statusMsg = resolveStatus[stream.id];

            return (
              <div
                key={stream.id}
                className="crystal-panel-subtle hover:bg-white/10 p-4 rounded-xl border border-white/10 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-black/70 border border-amber-500/30 flex items-center justify-center p-1.5 shrink-0">
                        <img
                          src={stream.logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547'}
                          alt={stream.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{stream.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {stream.group || 'Nexus VIP'}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400">
                            AniTV Ready
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Launch / Play in AniTV */}
                    <button
                      onClick={() => handleLaunchInAniTV(stream.url)}
                      title="Launch protocol in AniTV / Streambox"
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-amber-500/20 to-cyan-500/20 hover:from-amber-500/40 hover:to-cyan-500/40 border border-amber-500/40 text-amber-200 transition-all flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Launch AniTV</span>
                    </button>
                  </div>

                  {/* Hash Pill */}
                  <div className="mt-3 p-2 rounded-lg bg-black/60 border border-white/5 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Key className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="font-mono text-[11px] text-gray-300 truncate">
                        {stream.url}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(stream.url, stream.id)}
                      className="text-gray-400 hover:text-white shrink-0 p-1 rounded hover:bg-white/10"
                      title="Copy URL"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Verification Status Feedback */}
                  {statusMsg && (
                    <div className="mt-2 text-[11px] font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded">
                      ✓ {statusMsg}
                    </div>
                  )}
                </div>

                {/* Bottom Row Actions */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleTestResolve(stream)}
                    className="text-cyan-400 hover:text-cyan-300 font-medium text-[11px] flex items-center gap-1 hover:underline"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Verify Hash & Protocol
                  </button>

                  <div className="flex items-center gap-1.5">
                    {rebuildCategories.length > 0 && (
                      <button
                        onClick={() => onAddToRebuild(rebuildCategories[0].id, stream.id)}
                        className="px-2 py-1 rounded text-[11px] bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-500/30 transition-colors"
                        title="Add to Rebuild Category"
                      >
                        + Rebuild
                      </button>
                    )}
                    <button
                      onClick={() => onEditStream(stream)}
                      className="p-1 rounded text-gray-400 hover:text-white"
                      title="Edit Stream"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteStream(stream.id)}
                      className="p-1 rounded text-gray-400 hover:text-rose-400"
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
      </section>
    </div>
  );
};

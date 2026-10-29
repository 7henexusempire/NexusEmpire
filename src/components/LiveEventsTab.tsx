import React, { useState } from 'react';
import { ChannelStream, PlaylistSource, RebuildCategory } from '../types/playlist';
import {
  Calendar,
  Play,
  Copy,
  Check,
  Download,
  Share2,
  RefreshCw,
  Plus,
  Tv,
  Sparkles,
  Filter,
  ShieldAlert,
} from 'lucide-react';

interface LiveEventsTabProps {
  channels: ChannelStream[];
  sources: PlaylistSource[];
  rebuildCategories: RebuildCategory[];
  onPlayStream: (stream: ChannelStream) => void;
  onEditStream: (stream: ChannelStream) => void;
  onAddToRebuild: (categoryId: string, channelId: string) => void;
  onFetchSource: (sourceId: string) => void;
}

export const LiveEventsTab: React.FC<LiveEventsTabProps> = ({
  channels,
  sources,
  rebuildCategories,
  onPlayStream,
  onEditStream,
  onAddToRebuild,
  onFetchSource,
}) => {
  const [activeProvider, setActiveProvider] = useState<'ALL' | 'sony' | 'fancode' | 'zee5'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const eventStreams = channels.filter((c) => {
    if (c.status === 'trashed') return false;
    const isEventSource =
      c.sourceId.includes('fancode') ||
      c.sourceId.includes('sony') ||
      c.sourceId.includes('zee5') ||
      c.sourceName.toLowerCase().includes('fancode') ||
      c.sourceName.toLowerCase().includes('sony') ||
      c.sourceName.toLowerCase().includes('zee');

    if (!isEventSource) return false;

    if (activeProvider === 'sony') {
      return c.sourceId.includes('sony') || c.title.toLowerCase().includes('sony');
    }
    if (activeProvider === 'fancode') {
      return c.sourceId.includes('fancode') || c.title.toLowerCase().includes('fancode');
    }
    if (activeProvider === 'zee5') {
      return c.sourceId.includes('zee5') || c.title.toLowerCase().includes('zee');
    }
    return true;
  });

  const filteredStreams = eventStreams.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      (c.group && c.group.toLowerCase().includes(q)) ||
      c.url.toLowerCase().includes(q)
    );
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const origin = window.location.origin;

  return (
    <div className="space-y-6">
      {/* Top Banner & Dedicated M3U Generator Quick Links */}
      <section className="crystal-panel rounded-xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Live Sports & Events Hub (Fancode • SonyLIV • Zee5)
            </h2>
            <p className="text-xs text-gray-300">
              Auto-updating event schedules, live cricket, football, tennis, and entertainment feeds from primary GitHub repos & DRMLive backups.
            </p>
          </div>
        </div>

        {/* Dedicated M3U Endpoints Quick-Generator Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* SonyLIV Card */}
          <div className="crystal-panel-subtle p-3.5 rounded-lg border border-purple-500/20 hover:border-purple-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  SonyLIV Live Events
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                  .m3u & json
                </span>
              </div>
              <p className="text-[11px] text-gray-300 mt-1">
                Primary: doctor-8trange/zyphora • Backup: drmlive/sliv-live-events
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
              <button
                onClick={() => handleCopy(`${origin}/api/playlist/sony.m3u`, 'sony-m3u')}
                className="flex items-center gap-1 text-xs text-cyan-300 hover:text-white"
              >
                {copiedKey === 'sony-m3u' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'sony-m3u' ? 'Copied!' : 'Copy Sony M3U'}</span>
              </button>
              <a
                href="/api/playlist/sony.m3u"
                download="sony_live_events.m3u"
                className="p-1 rounded bg-black/40 hover:bg-black/80 text-gray-300 hover:text-white"
                title="Download Sony M3U"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Fancode Card */}
          <div className="crystal-panel-subtle p-3.5 rounded-lg border border-cyan-500/20 hover:border-cyan-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  Fancode Live Sports
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                  .m3u & json
                </span>
              </div>
              <p className="text-[11px] text-gray-300 mt-1">
                Primary: doctor-8trange/zyphx8 • Backup: drmlive/fancode-live-events
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
              <button
                onClick={() => handleCopy(`${origin}/api/playlist/fancode.m3u`, 'fancode-m3u')}
                className="flex items-center gap-1 text-xs text-cyan-300 hover:text-white"
              >
                {copiedKey === 'fancode-m3u' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'fancode-m3u' ? 'Copied!' : 'Copy Fancode M3U'}</span>
              </button>
              <a
                href="/api/playlist/fancode.m3u"
                download="fancode_live_sports.m3u"
                className="p-1 rounded bg-black/40 hover:bg-black/80 text-gray-300 hover:text-white"
                title="Download Fancode M3U"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Zee5 Card */}
          <div className="crystal-panel-subtle p-3.5 rounded-lg border border-amber-500/20 hover:border-amber-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Zee5 Live Channels
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                  .m3u & json
                </span>
              </div>
              <p className="text-[11px] text-gray-300 mt-1">
                Primary: doctor-8trange/quarnex live feeds & entertainment channels
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
              <button
                onClick={() => handleCopy(`${origin}/api/playlist/zee5.m3u`, 'zee5-m3u')}
                className="flex items-center gap-1 text-xs text-cyan-300 hover:text-white"
              >
                {copiedKey === 'zee5-m3u' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'zee5-m3u' ? 'Copied!' : 'Copy Zee5 M3U'}</span>
              </button>
              <a
                href="/api/playlist/zee5.m3u"
                download="zee5_live.m3u"
                className="p-1 rounded bg-black/40 hover:bg-black/80 text-gray-300 hover:text-white"
                title="Download Zee5 M3U"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs & Search */}
      <section className="crystal-panel rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Provider Pills */}
          <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-lg border border-white/10 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveProvider('ALL')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeProvider === 'ALL'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Events ({eventStreams.length})
            </button>
            <button
              onClick={() => setActiveProvider('sony')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeProvider === 'sony'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              SonyLIV
            </button>
            <button
              onClick={() => setActiveProvider('fancode')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeProvider === 'fancode'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Fancode
            </button>
            <button
              onClick={() => setActiveProvider('zee5')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeProvider === 'zee5'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Zee5
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search match, team, league..."
              className="w-full px-3 py-1.5 text-xs rounded-lg crystal-input text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
          {filteredStreams.length === 0 ? (
            <div className="col-span-full text-center py-12 crystal-panel-subtle rounded-lg">
              <Calendar className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-300 text-sm font-semibold">No live events loaded</p>
              <p className="text-gray-400 text-xs mt-1">
                Click "Fetch All Now" or select another provider tab to refresh the latest feeds.
              </p>
            </div>
          ) : (
            filteredStreams.map((event) => {
              const isCopied = copiedKey === event.id;

              return (
                <div
                  key={event.id}
                  className="crystal-panel-subtle hover:bg-white/10 p-3.5 rounded-xl border border-white/10 flex flex-col justify-between gap-3 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {event.logo ? (
                        <img
                          src={event.logo}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Tv className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/25 text-rose-300 border border-rose-500/40 uppercase font-bold">
                          LIVE
                        </span>
                        <span className="text-[10px] text-gray-300 font-mono truncate" title={event.group}>
                          {event.group}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1 line-clamp-2" title={event.title}>
                        {event.title}
                      </h4>
                      <p className="text-[10px] text-cyan-400 font-mono mt-0.5 truncate">
                        {event.sourceName}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <button
                      onClick={() => onPlayStream(event)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play Event</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {rebuildCategories.length > 0 && (
                        <button
                          onClick={() => onAddToRebuild(rebuildCategories[0].id, event.id)}
                          className="px-2 py-1 rounded text-[11px] bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-500/30"
                          title="Add to Rebuild Category"
                        >
                          + Rebuild
                        </button>
                      )}
                      <button
                        onClick={() => handleCopy(event.url, event.id)}
                        className="p-1 rounded bg-black/40 hover:bg-black/70 text-gray-300 hover:text-white"
                        title="Copy Event Stream URL"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

import React, { useState } from 'react';
import {
  ChannelStream,
  PlaylistSource,
  RebuildCategory,
} from '../types/playlist';
import {
  Search,
  Filter,
  Play,
  Edit2,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
  Layers,
  Copy,
  Check,
  Server,
  Sparkles,
} from 'lucide-react';

interface GlobalPlaylistsTabProps {
  sources: PlaylistSource[];
  channels: ChannelStream[];
  rebuildCategories: RebuildCategory[];
  publicBaseUrl: string;
  onPlayStream: (stream: ChannelStream) => void;
  onEditStream: (stream: ChannelStream) => void;
  onDeleteStream: (streamId: string) => void;
  onAddToRebuild: (categoryId: string, channelId: string) => void;
  onFetchSource: (sourceId: string) => void;
  onToggleAutoRefresh: (source: PlaylistSource) => void;
  onDeleteSource: (sourceId: string) => void;
  onOpenAddSource: () => void;
  onEditSource: (source: PlaylistSource) => void;
}

export const GlobalPlaylistsTab: React.FC<GlobalPlaylistsTabProps> = ({
  sources,
  channels,
  rebuildCategories,
  publicBaseUrl,
  onPlayStream,
  onEditStream,
  onDeleteStream,
  onAddToRebuild,
  onFetchSource,
  onToggleAutoRefresh,
  onDeleteSource,
  onOpenAddSource,
  onEditSource,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedSourceId, setSelectedSourceId] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedRebuildCat, setSelectedRebuildCat] = useState<string>(
    rebuildCategories[0]?.id || ''
  );

  // Derive unique groups
  const groups = Array.from(
    new Set(channels.map((c) => c.group || 'General').filter(Boolean))
  ).sort();

  // Filter channels
  const filteredChannels = channels.filter((c) => {
    if (c.status === 'trashed') return false;

    if (selectedSourceId !== 'ALL' && c.sourceId !== selectedSourceId) {
      return false;
    }

    if (selectedGroup !== 'ALL' && (c.group || 'General') !== selectedGroup) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchGroup = (c.group || '').toLowerCase().includes(q);
      const matchUrl = c.url.toLowerCase().includes(q);
      const matchTvg = (c.tvgName || c.tvgId || '').toLowerCase().includes(q);
      return matchTitle || matchGroup || matchUrl || matchTvg;
    }

    return true;
  });

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Source Overview */}
      <section className="crystal-panel rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              Connected Playlists & Gateways
            </h2>
            <p className="text-xs text-gray-300">
              Aggregating M3U URLs from GitHub, Cloudflare Pages, Workers, PHP backends, and Lovable apps.
            </p>
          </div>
          <button
            onClick={onOpenAddSource}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 transition-all shadow-md self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Add New Playlist
          </button>
        </div>

        {/* Source Cards Horizontal Carousel / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sources.map((src) => {
            const isOnline = src.status === 'online';
            const isFetching = src.status === 'fetching';
            const hasError = src.status === 'error';

            return (
              <div
                key={src.id}
                className={`p-3 rounded-lg border transition-all ${
                  selectedSourceId === src.id
                    ? 'crystal-panel border-cyan-400/60 ring-1 ring-cyan-400/30'
                    : 'crystal-panel-subtle hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isFetching
                            ? 'bg-amber-400 animate-ping'
                            : isOnline
                            ? 'bg-emerald-400'
                            : hasError
                            ? 'bg-rose-500'
                            : 'bg-gray-400'
                        }`}
                      />
                      <h3 className="font-semibold text-xs text-gray-100 truncate" title={src.name}>
                        {src.name}
                      </h3>
                    </div>
                    <p
                      className="text-[11px] font-mono text-gray-400 truncate mt-0.5"
                      title={src.url}
                    >
                      {src.url}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const url = `${publicBaseUrl}/${src.slug || src.id}.m3u`;
                        handleCopyUrl(url, `src-url-${src.id}`);
                      }}
                      title={`Copy Dedicated Playlist URL (/${src.slug || src.id}.m3u)`}
                      className="p-1 rounded bg-black/40 hover:bg-black/80 text-cyan-300 hover:text-white transition-colors"
                    >
                      {copiedId === `src-url-${src.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onEditSource(src)}
                      title="Edit / Rename Playlist & Slug"
                      className="p-1 rounded bg-black/40 hover:bg-black/80 text-gray-300 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onFetchSource(src.id)}
                      disabled={isFetching}
                      title="Fetch now"
                      className="p-1 rounded bg-black/40 hover:bg-black/80 text-gray-300 hover:text-white transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-amber-400' : ''}`} />
                    </button>
                    {src.category === 'custom' && (
                      <button
                        onClick={() => onDeleteSource(src.id)}
                        title="Remove source"
                        className="p-1 rounded bg-black/40 hover:bg-rose-900/40 text-gray-400 hover:text-rose-300 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="font-mono text-cyan-300">
                    {src.channelCount} streams
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSourceId(selectedSourceId === src.id ? 'ALL' : src.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        selectedSourceId === src.id
                          ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/50'
                          : 'bg-black/30 hover:bg-black/60 text-gray-300'
                      }`}
                    >
                      {selectedSourceId === src.id ? 'Selected' : 'Filter'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Channel Streams Explorer & Tools */}
      <section className="crystal-panel rounded-xl p-5 space-y-4">
        {/* Search, Filters, and Actions */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search streams by name, tvg-id, category, or URL..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg crystal-input text-white placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="bg-transparent text-gray-200 text-xs focus:outline-none cursor-pointer max-w-[160px]"
              >
                <option value="ALL" className="bg-gray-900 text-white">All Categories ({channels.length})</option>
                {groups.map((grp) => (
                  <option key={grp} value={grp} className="bg-gray-900 text-white">
                    {grp}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className="bg-transparent text-gray-200 text-xs focus:outline-none cursor-pointer max-w-[160px]"
              >
                <option value="ALL" className="bg-gray-900 text-white">All Gateways</option>
                {sources.map((src) => (
                  <option key={src.id} value={src.id} className="bg-gray-900 text-white">
                    {src.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Rebuild Target Category Picker */}
            {rebuildCategories.length > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-950/40 border border-purple-500/30 text-xs">
                <span className="text-[10px] text-purple-300 font-medium">Rebuild:</span>
                <select
                  value={selectedRebuildCat}
                  onChange={(e) => setSelectedRebuildCat(e.target.value)}
                  className="bg-transparent text-purple-200 text-xs focus:outline-none cursor-pointer max-w-[130px]"
                >
                  {rebuildCategories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-gray-900 text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Channels Counter & Info */}
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <span>
            Showing <strong className="text-white font-mono">{filteredChannels.length}</strong> of{' '}
            <strong className="text-white font-mono">{channels.length}</strong> streams
          </span>
          {(selectedGroup !== 'ALL' || selectedSourceId !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedGroup('ALL');
                setSelectedSourceId('ALL');
                setSearchQuery('');
              }}
              className="text-amber-400 hover:underline text-xs"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Streams List / Grid */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {filteredChannels.length === 0 ? (
            <div className="text-center py-12 crystal-panel-subtle rounded-lg">
              <p className="text-gray-300 text-sm font-semibold">No streams found</p>
              <p className="text-gray-400 text-xs mt-1">
                Try adjusting your search query, selecting another category, or fetching the playlists.
              </p>
            </div>
          ) : (
            filteredChannels.map((stream) => {
              const isCopied = copiedId === stream.id;

              return (
                <div
                  key={stream.id}
                  className="crystal-panel-subtle hover:bg-white/10 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors group"
                >
                  {/* Left: Logo & Channel Meta */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {stream.logo ? (
                        <img
                          src={stream.logo}
                          alt={stream.title}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xs font-bold text-gray-400">
                          {stream.title.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-white truncate" title={stream.title}>
                          {stream.title}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-500/20 font-mono">
                          {stream.group || 'General'}
                        </span>
                        {stream.tvgId && (
                          <span className="text-[10px] text-gray-400 font-mono hidden md:inline">
                            id: {stream.tvgId}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono truncate mt-0.5">
                        <span className="text-cyan-400 text-[10px] uppercase px-1 rounded bg-cyan-950/60 border border-cyan-800/40">
                          {stream.sourceName}
                        </span>
                        <span className="truncate opacity-70" title={stream.url}>
                          {stream.url}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    {/* Play Stream */}
                    <button
                      onClick={() => onPlayStream(stream)}
                      title="Test / Play Stream"
                      className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1 text-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span className="hidden sm:inline">Play</span>
                    </button>

                    {/* Add to Rebuild */}
                    {rebuildCategories.length > 0 && selectedRebuildCat && (
                      <button
                        onClick={() => onAddToRebuild(selectedRebuildCat, stream.id)}
                        title="Add to Rebuild Category"
                        className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/30 transition-colors flex items-center gap-1 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Rebuild</span>
                      </button>
                    )}

                    {/* Copy URL */}
                    <button
                      onClick={() => handleCopyUrl(stream.url, stream.id)}
                      title="Copy Stream URL"
                      className="p-1.5 rounded-lg bg-black/40 hover:bg-black/70 text-gray-300 hover:text-white border border-white/10 transition-colors"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {/* Edit Stream */}
                    <button
                      onClick={() => onEditStream(stream)}
                      title="Edit Stream Attributes"
                      className="p-1.5 rounded-lg bg-black/40 hover:bg-black/70 text-gray-300 hover:text-white border border-white/10 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Trash Stream */}
                    <button
                      onClick={() => onDeleteStream(stream.id)}
                      title="Move to Trash"
                      className="p-1.5 rounded-lg bg-black/40 hover:bg-rose-950/60 text-gray-400 hover:text-rose-400 border border-white/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

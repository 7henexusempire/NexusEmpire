import React, { useState } from 'react';
import { ChannelStream, RebuildCategory } from '../types/playlist';
import {
  Wrench,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Download,
  Copy,
  Check,
  Play,
  Layers,
  Sparkles,
  Search,
  ExternalLink,
} from 'lucide-react';

interface NexusRebuildTabProps {
  categories: RebuildCategory[];
  allChannels: ChannelStream[];
  onAddCategory: (name: string) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onRemoveStreamFromCategory: (categoryId: string, channelId: string) => void;
  onAddStreamToCategory: (categoryId: string, channelId: string) => void;
  onPlayStream: (stream: ChannelStream) => void;
  onEditStream: (stream: ChannelStream) => void;
}

export const NexusRebuildTab: React.FC<NexusRebuildTabProps> = ({
  categories,
  allChannels,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onRemoveStreamFromCategory,
  onAddStreamToCategory,
  onPlayStream,
  onEditStream,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?.id || '');
  const [channelSearch, setChannelSearch] = useState('');
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  const channelMap = new Map<string, ChannelStream>(allChannels.map((c) => [c.id, c]));
  const activeCategory = categories.find((c) => c.id === activeCategoryId) || categories[0];

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim());
    setNewCatName('');
  };

  const handleStartEditCat = (cat: RebuildCategory) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };

  const handleSaveEditCat = (catId: string) => {
    if (editingCatName.trim()) {
      onUpdateCategory(catId, editingCatName.trim());
    }
    setEditingCatId(null);
  };

  // Channels to add: streams not yet in the active category
  const candidateChannels = allChannels.filter((c) => {
    if (c.status === 'trashed') return false;
    if (activeCategory && activeCategory.channelIds.includes(c.id)) return false;
    if (!channelSearch.trim()) return true;

    const q = channelSearch.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      (c.group && c.group.toLowerCase().includes(q)) ||
      c.sourceName.toLowerCase().includes(q)
    );
  });

  const rebuildM3uUrl = `${window.location.origin}/api/playlist/rebuild.m3u`;

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <section className="crystal-panel rounded-xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-purple-400" />
              Nexus Rebuild Studio (Custom Playlist Builder)
            </h2>
            <p className="text-xs text-gray-300 mt-1">
              Assemble your own ultimate VIP playlist by creating custom categories and curating streams from any connected source.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                navigator.clipboard.writeText(rebuildM3uUrl);
                setCopiedEndpoint(true);
                setTimeout(() => setCopiedEndpoint(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/60 hover:bg-black/80 text-cyan-300 border border-cyan-500/30 transition-all"
            >
              {copiedEndpoint ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEndpoint ? 'Copied URL!' : 'Copy Rebuild M3U URL'}</span>
            </button>

            <a
              href="/api/playlist/rebuild.m3u"
              download="nexus_rebuild.m3u"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-500 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-gray-950 transition-all shadow-md"
            >
              <Download className="w-3.5 h-3.5" /> Download Rebuilt M3U
            </a>
          </div>
        </div>
      </section>

      {/* Main Studio Workspace: Left (Categories & Curated Streams), Right (Stream Library Picker) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Category Manager & Stream Reorder */}
        <div className="lg:col-span-7 space-y-4">
          {/* Create Category Form */}
          <div className="crystal-panel rounded-xl p-4">
            <form onSubmit={handleCreateCategory} className="flex items-center gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New Category Name (e.g. 👑 Premium Sports HD)"
                className="flex-1 px-3 py-2 text-xs rounded-lg crystal-input text-white placeholder-gray-400"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Category</span>
              </button>
            </form>

            {/* Category Selectors */}
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => {
                const isSelected = activeCategory?.id === cat.id;

                if (editingCatId === cat.id) {
                  return (
                    <div key={cat.id} className="flex items-center gap-1 shrink-0">
                      <input
                        type="text"
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="px-2 py-1 text-xs rounded bg-black text-white border border-cyan-400"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEditCat(cat.id)}
                        className="p-1 rounded bg-emerald-600 text-white text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={cat.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer shrink-0 transition-all ${
                      isSelected
                        ? 'bg-purple-600/30 text-purple-200 border border-purple-400/50 shadow-sm'
                        : 'bg-black/40 text-gray-300 hover:bg-black/60 border border-white/5'
                    }`}
                    onClick={() => setActiveCategoryId(cat.id)}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/60 text-gray-300 font-mono">
                      {cat.channelIds.length}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditCat(cat);
                      }}
                      className="p-0.5 rounded hover:text-white text-gray-400"
                      title="Rename"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCategory(cat.id);
                      }}
                      className="p-0.5 rounded hover:text-rose-400 text-gray-400"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Category Streams */}
          <div className="crystal-panel rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-300">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Streams in "{activeCategory?.name || 'Category'}" ({activeCategory?.channelIds.length || 0})
              </h3>
            </div>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {!activeCategory || activeCategory.channelIds.length === 0 ? (
                <div className="text-center py-10 crystal-panel-subtle rounded-lg">
                  <p className="text-gray-300 text-xs font-semibold">No streams in this category yet</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Pick channels from the library on the right to add them to this category.
                  </p>
                </div>
              ) : (
                activeCategory.channelIds.map((chId, idx) => {
                  const channel = channelMap.get(chId);
                  if (!channel) return null;

                  return (
                    <div
                      key={chId}
                      className="crystal-panel-subtle hover:bg-white/10 p-2.5 rounded-lg flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-[10px] font-mono text-gray-400 w-5 text-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="w-8 h-8 rounded bg-black/60 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {channel.logo ? (
                            <img
                              src={channel.logo}
                              alt=""
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400">
                              {channel.title.slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-white truncate text-xs" title={channel.title}>
                            {channel.title}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-mono truncate">
                            {channel.sourceName} • {channel.url}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onPlayStream(channel)}
                          className="p-1 rounded bg-black/40 hover:bg-emerald-950/60 text-emerald-400"
                          title="Play"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          onClick={() => onEditStream(channel)}
                          className="p-1 rounded bg-black/40 hover:bg-black/70 text-gray-300"
                          title="Edit Attributes"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onRemoveStreamFromCategory(activeCategory.id, chId)}
                          className="p-1 rounded bg-black/40 hover:bg-rose-950/60 text-rose-400"
                          title="Remove from Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Stream Library Picker */}
        <div className="lg:col-span-5 crystal-panel rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Add Streams to "{activeCategory?.name || 'Category'}"
              </h3>
              <p className="text-[11px] text-gray-300">
                Click "+ Add" to include any stream into this rebuild category.
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={channelSearch}
              onChange={(e) => setChannelSearch(e.target.value)}
              placeholder="Search stream library..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg crystal-input text-white placeholder-gray-400"
            />
          </div>

          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {candidateChannels.slice(0, 100).map((ch) => (
              <div
                key={ch.id}
                className="p-2 rounded-lg crystal-panel-subtle hover:bg-white/10 flex items-center justify-between gap-2 text-xs transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-white truncate text-xs" title={ch.title}>
                    {ch.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono mt-0.5">
                    <span className="text-amber-300">{ch.group || 'General'}</span>
                    <span>•</span>
                    <span className="text-cyan-400 truncate">{ch.sourceName}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (activeCategory) {
                      onAddStreamToCategory(activeCategory.id, ch.id);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/30 hover:bg-purple-500 text-purple-200 hover:text-white transition-colors shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

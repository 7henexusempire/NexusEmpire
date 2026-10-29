/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { ChannelItem, RebuiltPlaylist } from '../types';
import { 
  Plus, 
  Trash2, 
  Layers, 
  Search, 
  Radio, 
  Play, 
  Shuffle, 
  Save, 
  PlusCircle,
  GripVertical
} from 'lucide-react';

export default function NexusRebuildTab() {
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [rebuiltPlaylists, setRebuiltPlaylists] = useState<RebuiltPlaylist[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    fetch('/api/channels').then(res => res.json()).then(setChannels);
    fetch('/api/rebuild').then(res => res.json()).then(setRebuiltPlaylists);
  }, []);

  const activePlaylist = useMemo(() => 
    rebuiltPlaylists.find(p => p.id === activePlaylistId), 
    [rebuiltPlaylists, activePlaylistId]
  );

  const filteredChannels = useMemo(() => 
    channels.filter(ch => 
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.groupTitle.toLowerCase().includes(searchQuery.toLowerCase())
    ), [channels, searchQuery]
  );

  const handleCreateNew = async () => {
    const name = prompt('Enter playlist name:');
    if (!name) return;
    
    const res = await fetch('/api/rebuild', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const newP = await res.json();
    setRebuiltPlaylists([...rebuiltPlaylists, newP]);
    setActivePlaylistId(newP.id);
  };

  const handleAddCategory = () => {
    if (!activePlaylist || !newCategoryName.trim()) return;
    const updated = { 
      ...activePlaylist, 
      customCategories: { 
        ...activePlaylist.customCategories, 
        [newCategoryName.trim()]: [] 
      } 
    };
    savePlaylist(updated);
    setNewCategoryName('');
  };

  const handleAddChannelToCategory = (catName: string, channelId: string) => {
    if (!activePlaylist) return;
    const current = activePlaylist.customCategories[catName] || [];
    if (current.includes(channelId)) return;
    
    const updated = {
      ...activePlaylist,
      customCategories: {
        ...activePlaylist.customCategories,
        [catName]: [...current, channelId]
      }
    };
    savePlaylist(updated);
  };

  const handleRemoveChannelFromCategory = (catName: string, channelId: string) => {
    if (!activePlaylist) return;
    const updated = {
      ...activePlaylist,
      customCategories: {
        ...activePlaylist.customCategories,
        [catName]: activePlaylist.customCategories[catName].filter(id => id !== channelId)
      }
    };
    savePlaylist(updated);
  };

  const handleRemoveCategory = (catName: string) => {
    if (!activePlaylist) return;
    const { [catName]: _, ...remaining } = activePlaylist.customCategories;
    const updated = { ...activePlaylist, customCategories: remaining };
    savePlaylist(updated);
  };

  const savePlaylist = async (p: RebuiltPlaylist) => {
    setRebuiltPlaylists(rebuiltPlaylists.map(x => x.id === p.id ? p : x));
    await fetch(`/api/rebuild/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    await fetch(`/api/rebuild/${id}`, { method: 'DELETE' });
    setRebuiltPlaylists(rebuiltPlaylists.filter(p => p.id !== id));
    if (activePlaylistId === id) setActivePlaylistId(null);
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Sidebar: Playlist Selection */}
      <div className="col-span-12 lg:col-span-3 space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Layers size={16} className="text-amber-400" />
              Rebuilt Playlists
            </h3>
            <button 
              onClick={handleCreateNew}
              className="p-1 hover:bg-white/10 rounded-lg text-amber-400 transition-colors"
            >
              <PlusCircle size={20} />
            </button>
          </div>
          
          <div className="space-y-2">
            {rebuiltPlaylists.map(p => (
              <div 
                key={p.id}
                onClick={() => setActivePlaylistId(p.id)}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                  activePlaylistId === p.id ? 'bg-amber-500 text-black' : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <span className="text-sm font-medium truncate">{p.name}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(p.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 rounded transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {rebuiltPlaylists.length === 0 && (
              <div className="text-center py-4 text-xs text-white/40">
                No custom playlists yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="col-span-12 lg:col-span-9">
        {activePlaylist ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Pool of Channels */}
            <div className="bg-black/30 border border-white/10 rounded-2xl flex flex-col h-[700px]">
              <div className="p-4 border-b border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-sm">Available Channels</h3>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/60">
                    {filteredChannels.length} found
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                  <input 
                    type="text"
                    placeholder="Search name or group..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                {filteredChannels.slice(0, 200).map(ch => (
                  <div 
                    key={ch.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {ch.tvgLogo ? (
                          <img src={ch.tvgLogo} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <Radio className="w-4 h-4 text-white/30" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white truncate">{ch.name}</div>
                        <div className="text-[10px] text-white/40 truncate">{ch.groupTitle}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {Object.keys(activePlaylist.customCategories).map(catName => (
                        <button
                          key={catName}
                          onClick={() => handleAddChannelToCategory(catName, ch.id)}
                          className="p-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black rounded-lg transition-all"
                          title={`Add to ${catName}`}
                        >
                          <Plus size={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Curated Categories */}
            <div className="bg-black/30 border border-white/10 rounded-2xl flex flex-col h-[700px]">
              <div className="p-4 border-b border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Layers size={16} className="text-amber-400" />
                    Custom Bouquet
                  </h3>
                  <a 
                    href={`/${activePlaylist.slug}.m3u`}
                    target="_blank"
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    View M3U
                  </a>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Category name..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                  />
                  <button 
                    onClick={handleAddCategory}
                    className="px-3 py-2 bg-amber-500 text-black font-bold rounded-xl text-xs hover:bg-amber-400"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {Object.entries(activePlaylist.customCategories).map(([catName, chIds]) => (
                  <div key={catName} className="space-y-2">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">{catName}</h4>
                        <span className="text-[10px] text-white/40">{chIds.length} channels</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveCategory(catName)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-rose-400 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    
                    <div className="space-y-1">
                      {chIds.map(chId => {
                        const ch = channels.find(x => x.id === chId);
                        return (
                          <div 
                            key={chId}
                            className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <GripVertical size={12} className="text-white/20" />
                              <span className="text-[11px] text-white/80 truncate">{ch?.name || 'Unknown Channel'}</span>
                            </div>
                            <button 
                              onClick={() => handleRemoveChannelFromCategory(catName, chId)}
                              className="text-white/20 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })}
                      {chIds.length === 0 && (
                        <div className="text-[10px] text-white/20 italic p-4 text-center border border-dashed border-white/5 rounded-xl">
                          Empty category. Add channels from the left.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[700px] flex flex-col items-center justify-center bg-black/30 border border-white/10 rounded-2xl text-center p-12">
            <Layers size={48} className="text-white/10 mb-4" />
            <h3 className="text-white font-bold text-lg">No Playlist Selected</h3>
            <p className="text-white/40 text-sm max-w-sm mt-2">
              Select a custom playlist from the sidebar or create a new one to start rebuilding your perfect bouquet.
            </p>
            <button 
              onClick={handleCreateNew}
              className="mt-6 px-6 py-3 bg-amber-500 text-black font-bold rounded-2xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
            >
              Create New Playlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

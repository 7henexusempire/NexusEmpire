/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { ChannelItem, PlaylistSource } from '../types';
import { 
  Search, 
  Settings2, 
  Trash2, 
  RefreshCw, 
  Play, 
  Edit3, 
  Save, 
  X,
  Radio,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function GlobalPlaylistsTab() {
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [sources, setSources] = useState<PlaylistSource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ChannelItem>>({});
  
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 100;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [cRes, sRes] = await Promise.all([
      fetch('/api/channels'),
      fetch('/api/status')
    ]);
    const cData = await cRes.json();
    const sData = await sRes.json();
    setChannels(cData);
    setSources(sData.sources);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await fetch('/api/sync', { method: 'POST' });
    await fetchData();
    setIsSyncing(false);
  };

  const startEdit = (ch: ChannelItem) => {
    setEditingId(ch.id);
    setEditForm({
      customName: ch.customName || ch.name,
      customLogo: ch.customLogo || ch.tvgLogo || '',
      customGroup: ch.customGroup || ch.groupTitle,
      enabled: ch.enabled
    });
  };

  const saveEdit = async (id: string) => {
    await fetch(`/api/channels/${id}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    });
    setChannels(channels.map(ch => ch.id === id ? { ...ch, ...editForm } : ch));
    setEditingId(null);
  };

  const filteredChannels = useMemo(() => {
    return channels.filter(ch => 
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.groupTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [channels, searchQuery]);

  const paginatedChannels = useMemo(() => {
    return filteredChannels.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredChannels, page]);

  const totalPages = Math.ceil(filteredChannels.length / pageSize);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input 
              type="text"
              placeholder="Filter channels..."
              className="w-full bg-black/30 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-amber-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
          </div>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className={`p-3 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all ${isSyncing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto">
          {sources.map(source => (
            <div 
              key={source.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] whitespace-nowrap ${
                source.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                source.status === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                'bg-white/5 border-white/10 text-white/40'
              }`}
            >
              {source.status === 'success' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
              {source.name} ({source.channelCount})
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedChannels.map(ch => (
          <div 
            key={ch.id}
            className="bg-black/30 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all group relative"
          >
            {editingId === ch.id ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">Editing Stream</h4>
                  <button onClick={() => setEditingId(null)} className="text-white/40 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  <input 
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                    value={editForm.customName}
                    onChange={e => setEditForm({ ...editForm, customName: e.target.value })}
                    placeholder="Custom Name"
                  />
                  <input 
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                    value={editForm.customLogo}
                    onChange={e => setEditForm({ ...editForm, customLogo: e.target.value })}
                    placeholder="Logo URL"
                  />
                  <input 
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                    value={editForm.customGroup}
                    onChange={e => setEditForm({ ...editForm, customGroup: e.target.value })}
                    placeholder="Group Title"
                  />
                  <label className="flex items-center gap-2 text-[10px] text-white/60">
                    <input 
                      type="checkbox"
                      checked={editForm.enabled}
                      onChange={e => setEditForm({ ...editForm, enabled: e.target.checked })}
                    />
                    Enabled
                  </label>
                </div>
                <button 
                  onClick={() => saveEdit(ch.id)}
                  className="w-full py-2 bg-amber-500 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  <Save size={14} />
                  Save Changes
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {ch.customLogo || ch.tvgLogo ? (
                      <img src={ch.customLogo || ch.tvgLogo || ''} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <Radio className="w-6 h-6 text-white/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm truncate">{ch.customName || ch.name}</h4>
                    <p className="text-[10px] text-white/40 truncate uppercase tracking-tighter">{ch.customGroup || ch.groupTitle}</p>
                    <p className="text-[9px] text-amber-500/50 truncate font-mono mt-0.5">{ch.sourceId}</p>
                  </div>
                  <button 
                    onClick={() => startEdit(ch)}
                    className="p-2 bg-white/5 hover:bg-amber-500 hover:text-black rounded-lg transition-all text-white/40 opacity-0 group-hover:opacity-100"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${ch.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {ch.enabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                  <div className="flex gap-1">
                    {ch.directives?.length ? (
                      <span className="text-[8px] text-white/20 px-1 border border-white/10 rounded">DRCT</span>
                    ) : null}
                    <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60">
                      <Play size={12} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-8">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white disabled:opacity-20 hover:bg-white/10 transition-all"
          >
            Previous
          </button>
          <span className="text-xs text-white/60">Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white disabled:opacity-20 hover:bg-white/10 transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

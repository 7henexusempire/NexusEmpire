import React, { useState } from 'react';
import { PlaylistSource } from '../types/playlist';
import { X, Plus, Layers, Link2 } from 'lucide-react';

interface AddSourceModalProps {
  onClose: () => void;
  onAdd: (source: {
    name: string;
    url: string;
    type: 'm3u' | 'json' | 'streambox' | 'custom';
    category: 'global' | 'nexus' | 'events' | 'custom';
    backupUrl?: string;
  }) => void;
}

export const AddSourceModal: React.FC<AddSourceModalProps> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'m3u' | 'json' | 'streambox' | 'custom'>('m3u');
  const [category, setCategory] = useState<'global' | 'nexus' | 'events' | 'custom'>('global');
  const [backupUrl, setBackupUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    onAdd({
      name: name.trim(),
      url: url.trim(),
      type,
      category,
      backupUrl: backupUrl.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="crystal-panel rounded-2xl w-full max-w-lg overflow-hidden border border-cyan-400/30">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            Add Playlist Gateway or Remote Source
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-medium mb-1">Playlist Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Premium Cloudflare M3U"
              className="w-full px-3 py-2 rounded-lg crystal-input text-white"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">
              Source URL (M3U, PHP, Workers, GitHub raw, etc.)
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.workers.dev/playlist.m3u?pass=..."
              className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-medium mb-1">Source Format</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg crystal-input text-white cursor-pointer"
              >
                <option value="m3u" className="bg-gray-900">M3U / M3U8 Playlist</option>
                <option value="json" className="bg-gray-900">JSON Event Feed</option>
                <option value="custom" className="bg-gray-900">PHP / Dynamic Streamer</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">Placement Tab</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg crystal-input text-white cursor-pointer"
              >
                <option value="global" className="bg-gray-900">Global Playlists</option>
                <option value="nexus" className="bg-gray-900">Nexus Empire</option>
                <option value="events" className="bg-gray-900">Live Events</option>
                <option value="custom" className="bg-gray-900">Custom Gateway</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">
              Backup / Mirror URL (Optional Failover)
            </label>
            <input
              type="text"
              value={backupUrl}
              onChange={(e) => setBackupUrl(e.target.value)}
              placeholder="https://backup-stream.net/playlist.m3u"
              className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
            />
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium bg-black/40 hover:bg-black/60 text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg font-bold bg-cyan-500 hover:bg-cyan-400 text-gray-950 transition-colors shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Connect Playlist</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

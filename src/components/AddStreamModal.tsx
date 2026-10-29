import React, { useState } from 'react';
import { ChannelStream } from '../types/playlist';
import { X, Plus, Tv } from 'lucide-react';

interface AddStreamModalProps {
  onClose: () => void;
  onAdd: (stream: {
    title: string;
    url: string;
    group: string;
    logo?: string;
    tvgId?: string;
    tvgName?: string;
  }) => void;
}

export const AddStreamModal: React.FC<AddStreamModalProps> = ({ onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [group, setGroup] = useState('Custom Streams');
  const [logo, setLogo] = useState('');
  const [tvgId, setTvgId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    onAdd({
      title: title.trim(),
      url: url.trim(),
      group: group.trim() || 'Custom Streams',
      logo: logo.trim() || undefined,
      tvgId: tvgId.trim() || undefined,
      tvgName: title.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="crystal-panel rounded-2xl w-full max-w-lg overflow-hidden border border-purple-400/30">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-purple-400" />
            Add Single Stream to Library
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-medium mb-1">Stream Name</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. VIP Sports Live HD"
              className="w-full px-3 py-2 rounded-lg crystal-input text-white"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">Stream URL or streambox:// URI</label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://.../index.m3u8 or streambox://open/..."
              className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-medium mb-1">Category / Group</label>
              <input
                type="text"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder="e.g. Sports, Movies"
                className="w-full px-3 py-2 rounded-lg crystal-input text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-medium mb-1">TVG ID (EPG)</label>
              <input
                type="text"
                value={tvgId}
                onChange={(e) => setTvgId(e.target.value)}
                placeholder="e.g. sports.vip"
                className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">Logo URL (tvg-logo)</label>
            <input
              type="text"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://.../logo.png"
              className="w-full px-3 py-2 rounded-lg crystal-input text-white"
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
              className="px-5 py-2 rounded-lg font-bold bg-purple-500 hover:bg-purple-400 text-white transition-colors shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stream</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

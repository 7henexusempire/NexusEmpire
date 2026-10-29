import React, { useState } from 'react';
import { ChannelStream } from '../types/playlist';
import { X, Check, Edit2, Image, Tv, Link2 } from 'lucide-react';

interface EditStreamModalProps {
  stream: ChannelStream | null;
  onClose: () => void;
  onSave: (updated: Partial<ChannelStream>) => void;
}

export const EditStreamModal: React.FC<EditStreamModalProps> = ({ stream, onClose, onSave }) => {
  if (!stream) return null;

  const [title, setTitle] = useState(stream.title || '');
  const [group, setGroup] = useState(stream.group || 'General');
  const [logo, setLogo] = useState(stream.logo || '');
  const [tvgId, setTvgId] = useState(stream.tvgId || '');
  const [tvgName, setTvgName] = useState(stream.tvgName || '');
  const [url, setUrl] = useState(stream.url || '');
  const [userAgent, setUserAgent] = useState(stream.headers?.['User-Agent'] || '');
  const [referer, setReferer] = useState(stream.headers?.['Referer'] || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const headers: Record<string, string> = {};
    if (userAgent.trim()) headers['User-Agent'] = userAgent.trim();
    if (referer.trim()) headers['Referer'] = referer.trim();

    onSave({
      id: stream.id,
      title: title.trim(),
      group: group.trim() || 'General',
      logo: logo.trim() || undefined,
      tvgId: tvgId.trim() || undefined,
      tvgName: tvgName.trim() || title.trim(),
      url: url.trim(),
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="crystal-panel rounded-2xl w-full max-w-xl overflow-hidden border border-white/20">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-cyan-400" />
            Edit Stream & TVG Attributes
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Logo Preview & Logo URL */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-black/60 border border-white/15 flex items-center justify-center overflow-hidden shrink-0">
              {logo ? (
                <img
                  src={logo}
                  alt="Logo preview"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Image className="w-6 h-6 text-gray-500" />
              )}
            </div>

            <div className="flex-1">
              <label className="block text-gray-300 font-medium mb-1">
                TVG Logo Image URL (tvg-logo)
              </label>
              <input
                type="text"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://example.com/channel_logo.png"
                className="w-full px-3 py-2 rounded-lg crystal-input text-white"
              />
            </div>
          </div>

          {/* Title & Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-medium mb-1">Channel / Stream Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg crystal-input text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-medium mb-1">Category (group-title)</label>
              <input
                type="text"
                required
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder="e.g. Sports, Movies, VIP"
                className="w-full px-3 py-2 rounded-lg crystal-input text-white"
              />
            </div>
          </div>

          {/* TVG ID & TVG Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-medium mb-1">TVG ID (EPG mapping)</label>
              <input
                type="text"
                value={tvgId}
                onChange={(e) => setTvgId(e.target.value)}
                placeholder="e.g. sony.ten1.in"
                className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-medium mb-1">TVG Name</label>
              <input
                type="text"
                value={tvgName}
                onChange={(e) => setTvgName(e.target.value)}
                placeholder="e.g. Sony Sports Ten 1 HD"
                className="w-full px-3 py-2 rounded-lg crystal-input text-white"
              />
            </div>
          </div>

          {/* Stream URL */}
          <div>
            <label className="block text-gray-300 font-medium mb-1">
              Stream URL or streambox:// URI
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
            />
          </div>

          {/* Custom Headers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-gray-300 font-medium mb-1">Custom User-Agent</label>
              <input
                type="text"
                value={userAgent}
                onChange={(e) => setUserAgent(e.target.value)}
                placeholder="e.g. TiviMate/4.7.0"
                className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-medium mb-1">Custom HTTP Referer</label>
              <input
                type="text"
                value={referer}
                onChange={(e) => setReferer(e.target.value)}
                placeholder="e.g. https://domain.com"
                className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

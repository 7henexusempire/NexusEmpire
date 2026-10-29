import React, { useState } from 'react';
import { ChannelStream } from '../types/playlist';
import { X, Check, Edit2, Image, Tv, Link2, RotateCcw, Sparkles } from 'lucide-react';

interface EditStreamModalProps {
  stream: ChannelStream | null;
  availableGroups?: string[];
  onClose: () => void;
  onSave: (updated: Partial<ChannelStream>) => void;
}

export const EditStreamModal: React.FC<EditStreamModalProps> = ({
  stream,
  availableGroups = [],
  onClose,
  onSave,
}) => {
  if (!stream) return null;

  const [title, setTitle] = useState(stream.customName || stream.title || '');
  const [group, setGroup] = useState(stream.customGroup || stream.group || 'General');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [logo, setLogo] = useState(stream.customLogo || stream.logo || '');
  const [tvgId, setTvgId] = useState(stream.tvgId || '');
  const [tvgName, setTvgName] = useState(stream.tvgName || '');
  const [chno, setChno] = useState(stream.customChno || stream.chno || '');
  const [url, setUrl] = useState(stream.customUrl || stream.url || '');
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
      customName: title.trim(),
      group: group.trim() || 'General',
      customGroup: group.trim() || 'General',
      logo: logo.trim() || undefined,
      customLogo: logo.trim() || undefined,
      tvgId: tvgId.trim() || undefined,
      tvgName: tvgName.trim() || title.trim(),
      chno: chno.trim() || undefined,
      customChno: chno.trim() || undefined,
      url: url.trim(),
      customUrl: url.trim(),
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    onClose();
  };

  const handleReset = () => {
    setTitle(stream.title);
    setGroup(stream.group || 'General');
    setLogo(stream.logo || '');
    setUrl(stream.url);
    setChno('');
    setUserAgent('');
    setReferer('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="crystal-panel rounded-2xl w-full max-w-xl overflow-hidden border border-cyan-400/40 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">
              Edit Stream & TVG Attributes
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
          {/* Logo Preview & URL */}
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
                TVG Logo URL (tvg-logo)
              </label>
              <input
                type="text"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://example.com/channel_logo.png"
                className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
              />
            </div>
          </div>

          {/* Stream Title & Channel Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-gray-300 font-medium mb-1">Channel Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg crystal-input text-white"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">Channel No. (tvg-chno)</label>
              <input
                type="text"
                value={chno}
                onChange={(e) => setChno(e.target.value)}
                placeholder="101"
                className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
              />
            </div>
          </div>

          {/* Category selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-gray-300 font-medium">Category (group-title)</label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                {isCustomCategory ? 'Pick Existing Category' : '+ Create New Category'}
              </button>
            </div>

            {isCustomCategory ? (
              <input
                type="text"
                required
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder="e.g. VIP Sports 4K"
                className="w-full px-3 py-2 rounded-lg crystal-input text-white"
              />
            ) : (
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full px-3 py-2 rounded-lg crystal-input text-white cursor-pointer"
              >
                <option value={group} className="bg-gray-900">{group} (Current)</option>
                {availableGroups.filter((g) => g !== group).map((g) => (
                  <option key={g} value={g} className="bg-gray-900">
                    {g}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* TVG ID & TVG Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-medium mb-1">TVG ID (EPG Mapping)</label>
              <input
                type="text"
                value={tvgId}
                onChange={(e) => setTvgId(e.target.value)}
                placeholder="e.g. sports.ten1.in"
                className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-medium mb-1">TVG Name</label>
              <input
                type="text"
                value={tvgName}
                onChange={(e) => setTvgName(e.target.value)}
                placeholder="Sony Sports Ten 1"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Original</span>
            </button>

            <div className="flex items-center gap-2">
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
          </div>
        </form>
      </div>
    </div>
  );
};

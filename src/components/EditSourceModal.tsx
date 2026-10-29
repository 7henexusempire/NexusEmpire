import React, { useState } from 'react';
import { PlaylistSource } from '../types/playlist';
import { X, Check, Edit2, Link2, Globe } from 'lucide-react';

interface EditSourceModalProps {
  source: PlaylistSource | null;
  publicBaseUrl: string;
  onClose: () => void;
  onSave: (id: string, updated: Partial<PlaylistSource>) => void;
}

export const EditSourceModal: React.FC<EditSourceModalProps> = ({
  source,
  publicBaseUrl,
  onClose,
  onSave,
}) => {
  if (!source) return null;

  const [name, setName] = useState(source.name);
  const [slug, setSlug] = useState(source.slug || source.id);
  const [url, setUrl] = useState(source.url);
  const [backupUrl, setBackupUrl] = useState(source.backupUrl || '');
  const [autoRefresh, setAutoRefresh] = useState(source.autoRefresh !== false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    onSave(source.id, {
      name: name.trim(),
      slug: cleanSlug,
      url: url.trim(),
      backupUrl: backupUrl.trim() || undefined,
      autoRefresh,
    });

    onClose();
  };

  const dedicatedUrl = `${publicBaseUrl}/${slug || source.id}.m3u`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="crystal-panel rounded-2xl w-full max-w-lg overflow-hidden border border-amber-400/40">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              Edit Playlist Gateway & URL Slug
            </h3>
          </div>
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
              className="w-full px-3 py-2 rounded-lg crystal-input text-white"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">
              Custom URL Slug (Dedicated M3U Endpoint)
            </label>
            <div className="flex items-center gap-1">
              <span className="text-gray-400 font-mono text-[11px] px-2 py-2 rounded-l-lg bg-black/60 border border-r-0 border-white/10">
                /
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-playlist"
                className="w-full px-3 py-2 rounded-r-lg crystal-input text-white font-mono"
              />
              <span className="text-gray-400 font-mono text-[11px] px-2 py-2 rounded-r-lg bg-black/60 border border-l-0 border-white/10">
                .m3u
              </span>
            </div>
            <p className="text-[10px] text-cyan-300 mt-1 font-mono">
              Live Hosted URL: {dedicatedUrl}
            </p>
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">Source Stream / API URL</label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">Backup Mirror URL</label>
            <input
              type="text"
              value={backupUrl}
              onChange={(e) => setBackupUrl(e.target.value)}
              placeholder="https://.../backup.m3u"
              className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 text-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded bg-black border-white/20 text-amber-500"
              />
              <span>Include in 15-minute background auto-refresh</span>
            </label>
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
              className="px-5 py-2 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-gray-950 transition-colors shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Source</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

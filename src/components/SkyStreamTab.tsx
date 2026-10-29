import React, { useState } from 'react';
import { SkyStreamItem, StremioAddon } from '../types/playlist';
import {
  Download,
  Copy,
  Check,
  Search,
  ExternalLink,
  Sparkles,
  Radio,
  Tv,
} from 'lucide-react';

interface SkyStreamTabProps {
  skyItems: SkyStreamItem[];
  stremioAddons: StremioAddon[];
  publicBaseUrl: string;
}

export const SkyStreamTab: React.FC<SkyStreamTabProps> = ({
  skyItems,
  stremioAddons,
  publicBaseUrl,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'skystream' | 'stremio'>('skystream');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const skyM3uUrl = `${publicBaseUrl}/skystream.m3u`;
  const stremioM3uUrl = `${publicBaseUrl}/stremio.m3u`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="crystal-panel rounded-xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-purple-400" />
              SkyStream Universe & Stremio / Nuvio Ecosystem
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
              Official SkyStream extensions repository and Stremio / Nuvio community add-ons.
              Export full module catalogs into M3U playlists for seamless cross-player playback.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeSubTab === 'skystream' ? (
              <button
                onClick={() => handleCopy(skyM3uUrl, 'sky-m3u')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/60 hover:bg-black/80 text-cyan-300 border border-cyan-500/30 transition-all"
              >
                {copiedKey === 'sky-m3u' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'sky-m3u' ? 'Copied M3U URL!' : 'Copy SkyStream M3U'}</span>
              </button>
            ) : (
              <button
                onClick={() => handleCopy(stremioM3uUrl, 'stremio-m3u')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/60 hover:bg-black/80 text-purple-300 border border-purple-500/30 transition-all"
              >
                {copiedKey === 'stremio-m3u' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'stremio-m3u' ? 'Copied M3U URL!' : 'Copy Stremio M3U'}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Subtab Switcher */}
      <div className="flex items-center gap-2 p-1 bg-black/60 rounded-lg border border-white/10 w-fit text-xs">
        <button
          onClick={() => setActiveSubTab('skystream')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
            activeSubTab === 'skystream'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          SkyStream Universe Plugins ({skyItems.length})
        </button>
        <button
          onClick={() => setActiveSubTab('stremio')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
            activeSubTab === 'stremio'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Stremio & Nuvio Addons ({stremioAddons.length})
        </button>
      </div>

      {/* SkyStream Items View */}
      {activeSubTab === 'skystream' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {skyItems.map((item) => (
            <div
              key={item.id}
              className="crystal-panel-subtle hover:bg-white/10 p-3.5 rounded-xl border border-white/10 flex flex-col justify-between gap-3 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                    {item.category}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">v{item.version}</span>
                </div>
                <h4 className="text-xs font-bold text-white mt-1.5">{item.name}</h4>
                <p className="text-[11px] text-gray-300 mt-1 line-clamp-2">{item.description}</p>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-[10px] text-gray-400 font-mono">{item.author}</span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Plugin Feed</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stremio Items View */}
      {activeSubTab === 'stremio' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stremioAddons.map((addon) => (
            <div
              key={addon.id}
              className="crystal-panel-subtle hover:bg-white/10 p-3.5 rounded-xl border border-white/10 flex flex-col justify-between gap-3 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                  <img
                    src={addon.logo}
                    alt=""
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-cyan-300">v{addon.version}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-0.5 truncate">{addon.name}</h4>
                  <p className="text-[11px] text-gray-300 line-clamp-2 mt-0.5">
                    {addon.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-[10px] text-gray-400 font-mono">
                  {addon.types.join(', ')}
                </span>
                <a
                  href={addon.manifestUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Manifest</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

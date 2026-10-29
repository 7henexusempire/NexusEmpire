import React, { useState } from 'react';
import { PlaylistSource, ChannelStream } from '../types/playlist';
import {
  Share2,
  Copy,
  Check,
  Download,
  QrCode,
  Sliders,
  ExternalLink,
  Tv,
  Layers,
  Radio,
  Folder,
} from 'lucide-react';

interface M3uGeneratorTabProps {
  sources: PlaylistSource[];
  channels: ChannelStream[];
  publicBaseUrl: string;
}

export const M3uGeneratorTab: React.FC<M3uGeneratorTabProps> = ({
  sources,
  channels,
  publicBaseUrl,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrEndpoint, setQrEndpoint] = useState<string | null>(null);

  // Dynamic Generator State
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [customFilename, setCustomFilename] = useState('nexus_custom_vip');

  const defaultEndpoints = [
    {
      id: 'combined',
      title: 'Global Combined Playlist',
      description: 'All aggregated streams from all connected gateways and sources.',
      url: `${publicBaseUrl}/api/playlist/combined.m3u`,
      shortUrl: `${publicBaseUrl}/all.m3u`,
      filename: 'nexus_combined.m3u',
      badge: 'All-In-One',
      color: 'border-amber-500/40 text-amber-300',
    },
    {
      id: 'nexus',
      title: 'Nexus Empire Vault (AniTV / Streambox)',
      description: 'Dedicated Streambox protocol feeds with AniTV deep link triggers.',
      url: `${publicBaseUrl}/api/playlist/nexus-empire.m3u`,
      shortUrl: `${publicBaseUrl}/nexus.m3u`,
      filename: 'nexus_empire_vault.m3u',
      badge: 'AniTV Special',
      color: 'border-yellow-500/40 text-yellow-300',
    },
    {
      id: 'fancode',
      title: 'Fancode Live Sports',
      description: 'Live cricket, football, and tournament streams parsed from Fancode.',
      url: `${publicBaseUrl}/api/playlist/fancode.m3u`,
      shortUrl: `${publicBaseUrl}/fancode.m3u`,
      filename: 'nexus_fancode.m3u',
      badge: 'Sports Live',
      color: 'border-cyan-500/40 text-cyan-300',
    },
    {
      id: 'sony',
      title: 'SonyLIV Live Events',
      description: 'Sony sports, live channels, and special event broadcasts.',
      url: `${publicBaseUrl}/api/playlist/sony.m3u`,
      shortUrl: `${publicBaseUrl}/sony.m3u`,
      filename: 'nexus_sonyliv.m3u',
      badge: 'SonyLIV',
      color: 'border-purple-500/40 text-purple-300',
    },
    {
      id: 'zee5',
      title: 'Zee5 Live Feeds',
      description: 'Zee5 regional and entertainment live streams.',
      url: `${publicBaseUrl}/api/playlist/zee5.m3u`,
      shortUrl: `${publicBaseUrl}/zee5.m3u`,
      filename: 'nexus_zee5.m3u',
      badge: 'Zee5 Live',
      color: 'border-rose-500/40 text-rose-300',
    },
    {
      id: 'rebuild',
      title: 'Nexus Rebuild Custom Playlist',
      description: 'Curated custom categories and streams rebuilt in your personal studio.',
      url: `${publicBaseUrl}/api/playlist/rebuild.m3u`,
      shortUrl: `${publicBaseUrl}/rebuild.m3u`,
      filename: 'nexus_rebuild.m3u',
      badge: 'Rebuild Studio',
      color: 'border-emerald-500/40 text-emerald-300',
    },
    {
      id: 'cloudstream',
      title: 'CloudStream Extensions Relay',
      description: 'Official CNCVerse 48+ extensions catalog exported into M3U format.',
      url: `${publicBaseUrl}/cloudstream.m3u`,
      shortUrl: `${publicBaseUrl}/cloudstream.m3u`,
      filename: 'nexus_cloudstream.m3u',
      badge: 'CloudStream',
      color: 'border-blue-500/40 text-blue-300',
    },
    {
      id: 'skystream',
      title: 'SkyStream Universe & Plugins',
      description: 'SkyStream extensions and plugin repository.',
      url: `${publicBaseUrl}/skystream.m3u`,
      shortUrl: `${publicBaseUrl}/skystream.m3u`,
      filename: 'nexus_skystream.m3u',
      badge: 'SkyStream',
      color: 'border-pink-500/40 text-pink-300',
    },
  ];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const allGroups = Array.from(
    new Set(channels.map((c) => c.customGroup || c.group || 'General').filter(Boolean))
  ).sort();

  const queryParams = new URLSearchParams();
  if (selectedSources.length > 0) queryParams.set('sources', selectedSources.join(','));
  if (selectedGroups.length > 0) queryParams.set('groups', selectedGroups.join(','));
  if (customFilename.trim()) queryParams.set('name', customFilename.trim());

  const dynamicExportUrl = `${publicBaseUrl}/api/playlist/export?${queryParams.toString()}`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="crystal-panel rounded-xl p-5">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Share2 className="w-5 h-5 text-emerald-400" />
          Live Hosted M3U Endpoints & Generator
        </h2>
        <p className="text-xs text-gray-300 mt-1 max-w-3xl leading-relaxed">
          Clean URLs hosted on <strong>{publicBaseUrl}</strong> (port stripped for TiviMate, OTT Navigator, AniTV, and VLC compatibility).
          Each source, category, and rebuild set has its own dedicated live endpoint that automatically refreshes every 15 minutes.
        </p>
      </section>

      {/* Preset Hosted Endpoints Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {defaultEndpoints.map((ep) => {
          const isCopied = copiedKey === ep.id;

          return (
            <div
              key={ep.id}
              className={`crystal-panel rounded-xl p-4 border flex flex-col justify-between gap-3 ${ep.color}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-white truncate">{ep.title}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 border border-white/10 uppercase">
                    {ep.badge}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 mt-1 line-clamp-2">
                  {ep.description}
                </p>

                <div className="mt-3 p-2 rounded-lg bg-black/70 border border-white/5 flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-cyan-300 truncate select-all">
                    {ep.shortUrl}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCopy(ep.shortUrl, ep.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied!' : 'Copy URL'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setQrEndpoint(ep.shortUrl)}
                    className="p-1.5 rounded-lg bg-black/40 hover:bg-black/70 text-gray-300 hover:text-white"
                    title="Show QR Code for TV/Mobile scanning"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={ep.url}
                    download={ep.filename}
                    className="p-1.5 rounded-lg bg-black/40 hover:bg-black/70 text-gray-300 hover:text-white"
                    title="Download .m3u File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Dedicated Endpoints Per Connected Source */}
      <section className="crystal-panel rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          Dedicated Endpoints for Each Connected Playlist Source
        </h3>
        <p className="text-xs text-gray-300">
          Every connected playlist has its own permanent URL based on its slug.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {sources.map((src) => {
            const dedicatedUrl = `${publicBaseUrl}/${src.slug || src.id}.m3u`;
            const isCopied = copiedKey === `src-ep-${src.id}`;

            return (
              <div
                key={src.id}
                className="crystal-panel-subtle p-2.5 rounded-lg border border-white/5 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-white truncate text-xs">{src.name}</h4>
                  <span className="text-[10px] text-cyan-300 font-mono truncate block">
                    /{src.slug || src.id}.m3u
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopy(dedicatedUrl, `src-ep-${src.id}`)}
                    className="p-1.5 rounded bg-black/40 hover:bg-black/70 text-gray-300 hover:text-white"
                    title="Copy Dedicated URL"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={dedicatedUrl}
                    download={`${src.slug || src.id}.m3u`}
                    className="p-1.5 rounded bg-black/40 hover:bg-black/70 text-gray-300 hover:text-white"
                    title="Download .m3u"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dynamic Custom Playlist Generator */}
      <section className="crystal-panel rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Dynamic Custom Filtered M3U Generator
          </h3>
          <p className="text-xs text-gray-300 mt-0.5">
            Construct a live dynamic URL that automatically includes only specific sources or categories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="crystal-panel-subtle p-3.5 rounded-lg space-y-2">
            <span className="text-xs font-bold text-gray-200">1. Filter Sources (Optional)</span>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {sources.map((src) => {
                const isChecked = selectedSources.includes(src.id);
                return (
                  <label key={src.id} className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setSelectedSources((prev) =>
                          isChecked ? prev.filter((id) => id !== src.id) : [...prev, src.id]
                        );
                      }}
                      className="rounded bg-black border-white/20 text-cyan-500 focus:ring-0"
                    />
                    <span className="truncate">{src.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="crystal-panel-subtle p-3.5 rounded-lg space-y-2">
            <span className="text-xs font-bold text-gray-200">2. Filter Categories (Optional)</span>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {allGroups.map((grp) => {
                const isChecked = selectedGroups.includes(grp);
                return (
                  <label key={grp} className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setSelectedGroups((prev) =>
                          isChecked ? prev.filter((g) => g !== grp) : [...prev, grp]
                        );
                      }}
                      className="rounded bg-black border-white/20 text-cyan-500 focus:ring-0"
                    />
                    <span className="truncate">{grp}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-[11px] font-medium text-gray-300 mb-1">
              Custom M3U File Name
            </label>
            <input
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder="e.g. my_custom_sports_vip"
              className="w-full sm:w-80 px-3 py-1.5 text-xs rounded-lg crystal-input text-white"
            />
          </div>

          <div className="p-3 rounded-lg bg-black/60 border border-cyan-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-cyan-400 font-mono uppercase block mb-0.5">
                Dynamic Generated Endpoint:
              </span>
              <span className="font-mono text-xs text-white break-all select-all">
                {dynamicExportUrl}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopy(dynamicExportUrl, 'dynamic')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center gap-1.5"
              >
                {copiedKey === 'dynamic' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'dynamic' ? 'Copied!' : 'Copy Dynamic URL'}</span>
              </button>

              <a
                href={dynamicExportUrl}
                download={`${customFilename || 'nexus_export'}.m3u`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* QR Code Modal Display */}
      {qrEndpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="crystal-panel rounded-xl p-6 max-w-sm w-full space-y-4 border border-cyan-400/50">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-cyan-400" />
                Scan for Smart TV & Mobile
              </h3>
              <button
                onClick={() => setQrEndpoint(null)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded bg-black/40"
              >
                Close
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  qrEndpoint
                )}`}
                alt="QR Code"
                className="w-52 h-52 object-contain"
              />
            </div>

            <p className="text-[11px] text-center text-gray-300 font-mono break-all select-all">
              {qrEndpoint}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

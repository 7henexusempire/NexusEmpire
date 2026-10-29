import React, { useState } from 'react';
import { CloudStreamItem } from '../types/playlist';
import {
  Download,
  Copy,
  Check,
  Search,
  ExternalLink,
  Sparkles,
  Layers,
  FileCode,
} from 'lucide-react';

interface CloudStreamTabProps {
  items: CloudStreamItem[];
  publicBaseUrl: string;
}

export const CloudStreamTab: React.FC<CloudStreamTabProps> = ({ items, publicBaseUrl }) => {
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(search.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const cloudstreamM3uUrl = `${publicBaseUrl}/cloudstream.m3u`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="crystal-panel rounded-xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              CloudStream Extensions & CNCVerse Catalog
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
              Official CNCVerse CloudStream extension repository with 48+ anime, drama, sports, and movies extensions.
              All extensions can be installed directly into CloudStream 3 or ingested as an M3U playlist.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(cloudstreamM3uUrl, 'cs-m3u')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/60 hover:bg-black/80 text-cyan-300 border border-cyan-500/30 transition-all"
            >
              {copiedKey === 'cs-m3u' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'cs-m3u' ? 'Copied M3U URL!' : 'Copy CloudStream M3U'}</span>
            </button>

            <a
              href="/cloudstream.m3u"
              download="cloudstream_extensions.m3u"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-gray-950 transition-all shadow-md"
            >
              <Download className="w-3.5 h-3.5" /> Download .M3U
            </a>
          </div>
        </div>
      </section>

      {/* Search & Grid */}
      <section className="crystal-panel rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search CloudStream extensions..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg crystal-input text-white"
            />
          </div>

          <span className="text-xs text-gray-400">
            Total Extensions: <strong className="text-white font-mono">{filteredItems.length}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="crystal-panel-subtle hover:bg-white/10 p-3.5 rounded-xl border border-white/10 flex flex-col justify-between gap-3 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                  {item.logo ? (
                    <img
                      src={item.logo}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <FileCode className="w-5 h-5 text-cyan-400" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                      {item.category || 'Extension'}
                    </span>
                    {item.version && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        v{item.version}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1 truncate" title={item.name}>
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-gray-300 line-clamp-2 mt-0.5">
                    {item.description || 'CloudStream 3 provider plugin'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-[10px] text-gray-400 font-mono">
                  {item.author || 'NivinCNC'}
                </span>

                <div className="flex items-center gap-2">
                  <a
                    href={item.url}
                    download={`${item.name}.cs3`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-white"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .cs3</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

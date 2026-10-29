/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Trophy, 
  Tv, 
  ExternalLink, 
  Copy, 
  Check, 
  Flame,
  Zap,
  Calendar
} from 'lucide-react';

interface Event {
  name: string;
  url: string;
  logo?: string;
  category?: string;
  time?: string;
}

export default function SportsHubTab() {
  const [fancode, setFancode] = useState<any[]>([]);
  const [sony, setSony] = useState<any[]>([]);
  const [zee5, setZee5] = useState<any[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/external/fancode').then(res => res.json()).then(setFancode).catch(() => {});
    fetch('/api/external/sony').then(res => res.json()).then(setSony).catch(() => {});
    fetch('/api/external/zee5').then(res => res.json()).then(setZee5).catch(() => {});
  }, []);

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-12 pb-24">
      {/* SonyLIV Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center">
            <Tv className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">SonyLIV Live</h2>
            <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">Premium Sports & Shows</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.isArray(sony) && sony.slice(0, 8).map((event, i) => (
            <EventCard key={i} event={event} onCopy={copyToClipboard} copied={copiedUrl === event.url} />
          ))}
          {!sony.length && <EmptyPlaceholder label="No SonyLIV events active" />}
        </div>
      </section>

      {/* FanCode Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center">
            <Flame className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">FanCode Events</h2>
            <p className="text-xs text-orange-400 font-bold uppercase tracking-widest">Live Match Coverage</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.isArray(fancode) && fancode.slice(0, 8).map((event, i) => (
            <EventCard key={i} event={event} onCopy={copyToClipboard} copied={copiedUrl === event.url} />
          ))}
          {!fancode.length && <EmptyPlaceholder label="No FanCode events active" />}
        </div>
      </section>

      {/* Zee5 Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500 rounded-2xl flex items-center justify-center">
            <Zap className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Zee5 Premium</h2>
            <p className="text-xs text-purple-400 font-bold uppercase tracking-widest">Movies & Live Channels</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.isArray(zee5) && zee5.slice(0, 8).map((event, i) => (
            <EventCard key={i} event={event} onCopy={copyToClipboard} copied={copiedUrl === event.url} />
          ))}
          {!zee5.length && <EmptyPlaceholder label="No Zee5 content active" />}
        </div>
      </section>
    </div>
  );
}

function EventCard({ event, onCopy, copied }: { event: any; onCopy: (url: string) => void; copied: boolean }) {
  const name = event.name || event.title || 'Live Event';
  const url = event.url || event.stream_url || '';
  const logo = event.logo || event.thumbnail || 'https://ik.imagekit.io/7henexusempire/nexusprime.png';

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all group">
      <div className="aspect-video rounded-xl bg-black/40 mb-4 overflow-hidden border border-white/5 relative">
        <img src={logo} alt="" className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg animate-pulse">
          LIVE
        </div>
      </div>
      <h3 className="text-white font-bold text-sm line-clamp-1 mb-1">{name}</h3>
      <div className="flex items-center gap-2 text-[10px] text-white/40 mb-4">
        <Calendar size={12} />
        <span>Live Now</span>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => onCopy(url)}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-amber-500 hover:text-black rounded-xl transition-all text-xs font-bold"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Stream Link'}
        </button>
        <a 
          href={url}
          target="_blank"
          rel="noreferrer"
          className="p-2 bg-white/5 hover:bg-white/20 text-white rounded-xl transition-colors"
        >
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}

function EmptyPlaceholder({ label }: { label: string }) {
  return (
    <div className="col-span-full py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-white/20">
      <Trophy size={32} className="mb-2 opacity-20" />
      <p className="text-xs">{label}</p>
    </div>
  );
}

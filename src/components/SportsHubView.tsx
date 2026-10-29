import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Tv, 
  ExternalLink, 
  Copy, 
  Check, 
  Flame,
  Zap,
  Calendar,
  Search,
  RefreshCw
} from 'lucide-react';

interface SportsEvent {
  name: string;
  url: string;
  logo?: string;
  category?: string;
  time?: string;
}

interface SportsHubViewProps {
  onNotify: (type: 'success' | 'error' | 'info' | 'loading', title: string, message?: string) => void;
}

export const SportsHubView: React.FC<SportsHubViewProps> = ({ onNotify }) => {
  const [fancode, setFancode] = useState<any[]>([]);
  const [sony, setSony] = useState<any[]>([]);
  const [zee5, setZee5] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resFan, resSony, resZee] = await Promise.all([
        fetch('/api/external/fancode'),
        fetch('/api/external/sony'),
        fetch('/api/external/zee5')
      ]);

      if (resFan.ok) setFancode(await resFan.json());
      if (resSony.ok) setSony(await resSony.json());
      if (resZee.ok) setZee5(await resZee.json());
    } catch (err) {
      console.error(err);
      onNotify('error', 'Failed to load sports events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    onNotify('success', 'URL Copied', url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const filterEvents = (events: any[]) => {
    if (!Array.isArray(events)) return [];
    if (!searchQuery) return events;
    return events.filter(e => 
      (e.name || e.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {/* Top Search & Refresh */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl ">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
            <Trophy className="text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Sports Hub</h2>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Live Match Coverage</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search matches or tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:border-emerald-500 outline-none"
            />
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && !fancode.length && !sony.length && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-400 font-medium">Fetching live event feeds...</p>
        </div>
      )}

      {/* SonyLIV Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Tv className="text-blue-400 w-4 h-4" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">SonyLIV Events</h3>
          <span className="h-[1px] flex-1 bg-gradient-to-r from-blue-500/30 to-transparent ml-2"></span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filterEvents(sony).map((event, i) => (
            <EventCard key={i} event={event} onCopy={copyToClipboard} copied={copiedUrl === event.url} theme="blue" />
          ))}
          {!filterEvents(sony).length && !loading && <EmptyPlaceholder label="No SonyLIV events found" />}
        </div>
      </section>

      {/* FanCode Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Flame className="text-orange-400 w-4 h-4" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">FanCode Live</h3>
          <span className="h-[1px] flex-1 bg-gradient-to-r from-orange-500/30 to-transparent ml-2"></span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filterEvents(fancode).map((event, i) => (
            <EventCard key={i} event={event} onCopy={copyToClipboard} copied={copiedUrl === event.url} theme="orange" />
          ))}
          {!filterEvents(fancode).length && !loading && <EmptyPlaceholder label="No FanCode events found" />}
        </div>
      </section>

      {/* Zee5 Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Zap className="text-purple-400 w-4 h-4" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Zee5 Premium</h3>
          <span className="h-[1px] flex-1 bg-gradient-to-r from-purple-500/30 to-transparent ml-2"></span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filterEvents(zee5).map((event, i) => (
            <EventCard key={i} event={event} onCopy={copyToClipboard} copied={copiedUrl === event.url} theme="purple" />
          ))}
          {!filterEvents(zee5).length && !loading && <EmptyPlaceholder label="No Zee5 content found" />}
        </div>
      </section>
    </div>
  );
};

function EventCard({ event, onCopy, copied, theme }: { event: any; onCopy: (url: string) => void; copied: boolean; theme: 'blue' | 'orange' | 'purple' }) {
  const name = event.name || event.title || 'Live Event';
  const url = event.url || event.stream_url || '';
  const logo = event.logo || event.thumbnail || 'https://ik.imagekit.io/7henexusempire/nexusprime.png';
  const category = event.category || 'Live Match';

  const themeColors = {
    blue: 'border-blue-500/20 hover:border-blue-500/50',
    orange: 'border-orange-500/20 hover:border-orange-500/50',
    purple: 'border-purple-500/20 hover:border-purple-500/50'
  };

  const badgeColors = {
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  };

  return (
    <div className={`bg-slate-900/60 border ${themeColors[theme]} rounded-2xl p-4 hover:bg-slate-900 transition-all group shadow-lg`}>
      <div className="aspect-video rounded-xl bg-black/40 mb-4 overflow-hidden border border-white/5 relative">
        <img 
          src={logo} 
          alt="" 
          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" 
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://ik.imagekit.io/7henexusempire/nexusprime.png'; }}
        />
        <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg animate-pulse shadow-lg">
          LIVE
        </div>
      </div>
      
      <div className="space-y-1 mb-4">
        <div className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${badgeColors[theme]}`}>
          {category}
        </div>
        <h3 className="text-white font-bold text-sm line-clamp-1 leading-tight group-hover:text-emerald-400 transition-colors">{name}</h3>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => onCopy(url)}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-emerald-600 text-white hover:text-white rounded-xl transition-all text-xs font-bold border border-slate-700 hover:border-emerald-500"
        >
          {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Stream Link'}
        </button>
        <a 
          href={url}
          target="_blank"
          rel="noreferrer"
          className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl transition-colors"
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
      <Trophy size={32} className="mb-2 opacity-10" />
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

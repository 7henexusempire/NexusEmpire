/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { NexusEmpireItem } from '../types';
import { ExternalLink, Copy, Check, PlayCircle } from 'lucide-react';

export default function NexusEmpireTab() {
  const [items, setItems] = useState<NexusEmpireItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/nexusempire')
      .then(res => res.json())
      .then(setItems);
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const launchStreambox = (uri: string) => {
    window.location.href = uri;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div 
            key={item.id}
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all group"
          >
            <div className="relative h-40 overflow-hidden">
              <img 
                src={item.logo} 
                alt={item.name} 
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-bold text-white">{item.name}</h3>
                <p className="text-xs text-white/60">{item.category}</p>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-sm text-white/70 line-clamp-2 h-10">
                {item.description}
              </p>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => launchStreambox(item.uri)}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors"
                >
                  <PlayCircle size={18} />
                  Launch Streambox
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/${item.slug}.m3u`, item.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm"
                  >
                    {copiedId === item.id ? <Check size={16} /> : <Copy size={16} />}
                    {copiedId === item.id ? 'Copied' : 'Copy M3U'}
                  </button>
                  
                  <a
                    href={`/${item.slug}.m3u`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

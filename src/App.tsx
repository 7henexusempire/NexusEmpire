/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Shield, 
  Layers, 
  Globe, 
  Settings, 
  Activity, 
  Database,
  Crown,
  PlayCircle
} from 'lucide-react';
import VideoBackground from './components/VideoBackground';
import NexusEmpireTab from './components/NexusEmpireTab';
import NexusRebuildTab from './components/NexusRebuildTab';
import GlobalPlaylistsTab from './components/GlobalPlaylistsTab';
import SportsHubTab from './components/SportsHubTab';

type Tab = 'empire' | 'rebuild' | 'global' | 'sports' | 'status';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('empire');

  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-amber-500/30">
      <VideoBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="text-black" size={28} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">NEXUS EMPIRE</h1>
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em]">Stream Engine & Studio</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 bg-black/30 p-1.5 rounded-2xl border border-white/5">
            <TabButton 
              active={activeTab === 'empire'} 
              onClick={() => setActiveTab('empire')}
              icon={<Shield size={16} />}
              label="Nexus Empire"
            />
            <TabButton 
              active={activeTab === 'rebuild'} 
              onClick={() => setActiveTab('rebuild')}
              icon={<Layers size={16} />}
              label="Nexus Rebuild"
            />
            <TabButton 
              active={activeTab === 'global'} 
              onClick={() => setActiveTab('global')}
              icon={<Globe size={16} />}
              label="Global Streams"
            />
            <TabButton 
              active={activeTab === 'sports'} 
              onClick={() => setActiveTab('sports')}
              icon={<PlayCircle size={16} className="text-emerald-400" />}
              label="Sports Hub"
            />
            <TabButton 
              active={activeTab === 'status'} 
              onClick={() => setActiveTab('status')}
              icon={<Activity size={16} />}
              label="System"
            />
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col items-end mr-2">
              <span className="text-[10px] text-white/40 uppercase font-bold">Server Port</span>
              <span className="text-xs text-amber-500 font-mono">8443</span>
            </div>
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-white/60">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === 'empire' && <NexusEmpireTab />}
          {activeTab === 'rebuild' && <NexusRebuildTab />}
          {activeTab === 'global' && <GlobalPlaylistsTab />}
          {activeTab === 'sports' && <SportsHubTab />}
          {activeTab === 'status' && <StatusTab />}
        </div>
      </main>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-2 flex justify-around shadow-2xl">
        <MobileTabButton active={activeTab === 'empire'} onClick={() => setActiveTab('empire')} icon={<Shield size={20} />} />
        <MobileTabButton active={activeTab === 'rebuild'} onClick={() => setActiveTab('rebuild')} icon={<Layers size={20} />} />
        <MobileTabButton active={activeTab === 'global'} onClick={() => setActiveTab('global')} icon={<Globe size={20} />} />
        <MobileTabButton active={activeTab === 'sports'} onClick={() => setActiveTab('sports')} icon={<PlayCircle size={20} />} />
        <MobileTabButton active={activeTab === 'status'} onClick={() => setActiveTab('status')} icon={<Activity size={20} />} />
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${
        active 
          ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/10' 
          : 'text-white/40 hover:text-white/80 hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function MobileTabButton({ active, onClick, icon }: { active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl transition-all ${
        active ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-white/40'
      }`}
    >
      {icon}
    </button>
  );
}

function StatusTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-black/30 border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Database className="text-amber-500" size={24} />
          <h3 className="text-white font-bold">Persistence Engine</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Mode</span>
            <span className="text-emerald-400 font-mono">FILESYSTEM_JSON</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Cache Size</span>
            <span className="text-white">~2.4 MB</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Auto-Save</span>
            <span className="text-emerald-400">ENABLED</span>
          </div>
        </div>
      </div>
      
      <div className="bg-black/30 border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Activity className="text-amber-500" size={24} />
          <h3 className="text-white font-bold">Sync Worker</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Interval</span>
            <span className="text-white">15 Minutes</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Status</span>
            <span className="text-emerald-400">OPERATIONAL</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Worker ID</span>
            <span className="text-white font-mono">NX-2903-W</span>
          </div>
        </div>
      </div>

      <div className="bg-black/30 border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Crown className="text-amber-500" size={24} />
          <h3 className="text-white font-bold">License & Node</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Edition</span>
            <span className="text-amber-500 font-bold italic">PRIME</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Uptime</span>
            <span className="text-white">99.99%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Node Location</span>
            <span className="text-white">CONTABO_VPS_EU</span>
          </div>
        </div>
      </div>
    </div>
  );
}

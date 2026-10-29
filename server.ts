/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  ChannelItem, 
  PlaylistSource, 
  NexusEmpireItem, 
  PlaylistSettings, 
  CustomizationData, 
  RebuiltPlaylist 
} from './src/types';
import { parseM3U } from './src/utils/m3uParser';
import { deduplicateChannelList, normalizeStreamUrl } from './src/utils/deduplicator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const CUSTOMIZATIONS_FILE = path.join(DATA_DIR, 'customizations.json');
const CACHE_FILE = path.join(DATA_DIR, 'cache.json');
const REBUILT_FILE = path.join(DATA_DIR, 'rebuilt-playlists.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_SOURCES: PlaylistSource[] = [
  {
    id: 'tivimate-hjh',
    slug: 'tivimate-hjh',
    name: 'Tivimate Playlist',
    url: 'https://hjh-545.pages.dev/',
    type: 'remote',
    enabled: true,
    lastSyncTime: null,
    status: 'idle',
    errorMessage: null,
    channelCount: 0,
  },
  {
    id: 'plugx-vip',
    slug: 'plugx-vip',
    name: 'Plugx VIP',
    url: 'https://plugxvipplaylist.lovable.app/api/playlist',
    type: 'remote',
    enabled: true,
    lastSyncTime: null,
    status: 'idle',
    errorMessage: null,
    channelCount: 0,
  },
  {
    id: 'stalkmax',
    slug: 'stalkmax',
    name: 'StalkMax Nexus',
    url: 'https://stalkmax.7henexusempire.workers.dev/playlist.m3u?pass=Nexus07',
    type: 'remote',
    enabled: true,
    lastSyncTime: null,
    status: 'idle',
    errorMessage: null,
    channelCount: 0,
  },
  {
    id: 'p1stalk',
    slug: 'p1stalk',
    name: 'P1Stalk Nexus',
    url: 'https://p1stalk.7henexusempire.workers.dev/playlist.m3u?pass=Nexus07',
    type: 'remote',
    enabled: true,
    lastSyncTime: null,
    status: 'idle',
    errorMessage: null,
    channelCount: 0,
  },
  {
    id: 'lrl45',
    slug: 'lrl45',
    name: 'LRL45 Channel',
    url: 'https://server.lrl45.workers.dev/channel/raw?=m3u',
    type: 'remote',
    enabled: true,
    lastSyncTime: null,
    status: 'idle',
    errorMessage: null,
    channelCount: 0,
  },
  {
    id: 'p1stalk-php',
    slug: 'p1stalk-php',
    name: 'P1Stalk PHP',
    url: 'https://p1stalk.7henexusempire.workers.dev/playlist.php?pass=Nexus07',
    type: 'remote',
    enabled: true,
    lastSyncTime: null,
    status: 'idle',
    errorMessage: null,
    channelCount: 0,
  },
  // Sony / Fancode / Zee5
  {
    id: 'fancode-m3u',
    slug: 'fancode-m3u',
    name: 'Fancode Live',
    url: 'https://raw.githubusercontent.com/doctor-8trange/zyphx8/refs/heads/main/data/fancode.m3u',
    type: 'remote',
    enabled: true,
    lastSyncTime: null,
    status: 'idle',
    errorMessage: null,
    channelCount: 0,
  },
  {
    id: 'sony-m3u',
    slug: 'sony-m3u',
    name: 'Sony Live',
    url: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.m3u',
    type: 'remote',
    enabled: true,
    lastSyncTime: null,
    status: 'idle',
    errorMessage: null,
    channelCount: 0,
  },
  {
    id: 'zee5-m3u',
    slug: 'zee5-m3u',
    name: 'Zee5 Live',
    url: 'https://raw.githubusercontent.com/doctor-8trange/quarnex/refs/heads/main/data/zee5.m3u',
    type: 'remote',
    enabled: true,
    lastSyncTime: null,
    status: 'idle',
    errorMessage: null,
    channelCount: 0,
  }
];

const INITIAL_NEXUSEMPIRE: NexusEmpireItem[] = [
  {
    id: 'zee',
    name: 'Zee Network Live',
    uri: 'streambox://open/8003bfd97ec3d87c8df2280494c3aa26',
    hash: '8003bfd97ec3d87c8df2280494c3aa26',
    slug: 'zee',
    m3uSlug: 'zee',
    category: 'Entertainment',
    channelCount: 0,
    status: 'ready',
    lastUpdated: null,
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    description: 'Zee Network live streams for AniTV & StreamBox.',
    enabled: true,
  },
  {
    id: 'sony',
    name: 'Sony Network All',
    uri: 'streambox://open/4397be6aa83e687053eeb1f55b4f9f48',
    hash: '4397be6aa83e687053eeb1f55b4f9f48',
    slug: 'sony',
    m3uSlug: 'sony',
    category: 'Entertainment',
    channelCount: 0,
    status: 'ready',
    lastUpdated: null,
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    description: 'Sony Network channels including Ten Sports.',
    enabled: true,
  },
  {
    id: 'matchevents',
    name: 'All Match Events',
    uri: 'streambox://open/dbd3d88df5fe1594d5d64afb3b6704be',
    hash: 'dbd3d88df5fe1594d5d64afb3b6704be',
    slug: 'matchevents',
    m3uSlug: 'matchevents',
    category: 'Sports',
    channelCount: 0,
    status: 'ready',
    lastUpdated: null,
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    description: 'Live match events and sports schedules.',
    enabled: true,
  },
  {
    id: 'willow',
    name: 'Willow TV Channel',
    uri: 'streambox://open/255cfab9f98da87dab11a6e0a337279e',
    hash: '255cfab9f98da87dab11a6e0a337279e',
    slug: 'willow',
    m3uSlug: 'willow',
    category: 'Sports',
    channelCount: 0,
    status: 'ready',
    lastUpdated: null,
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    description: 'Willow TV cricket and sports channel.',
    enabled: true,
  },
  {
    id: 'alltv',
    name: 'All TV Channels',
    uri: 'streambox://open/188140cf39bd8728cfa2f19290218e2b',
    hash: '188140cf39bd8728cfa2f19290218e2b',
    slug: 'alltv',
    m3uSlug: 'alltv',
    category: 'Master',
    channelCount: 0,
    status: 'ready',
    lastUpdated: null,
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    description: 'Combined master playlist for all TV channels.',
    enabled: true,
  },
  {
    id: 'adult',
    name: '18+ Premium Content',
    uri: 'streambox://open/d45fee7c264f4c64e29a1c5162d8ad8e',
    hash: 'd45fee7c264f4c64e29a1c5162d8ad8e',
    slug: 'adult',
    m3uSlug: 'adult',
    category: 'Premium',
    channelCount: 0,
    status: 'ready',
    lastUpdated: null,
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    description: 'Premium quality adult content for version 4.0.0+.',
    enabled: true,
  }
];

class PlaylistService {
  public sources: PlaylistSource[] = [...DEFAULT_SOURCES];
  public nexusempireItems: NexusEmpireItem[] = [...INITIAL_NEXUSEMPIRE];
  public channelsBySource: Record<string, ChannelItem[]> = {};
  public channelOverrides: Record<string, Partial<ChannelItem>> = {};
  public settings: PlaylistSettings = {
    syncIntervalMinutes: 15,
    autoSync: true,
    userAgent: 'TiviMate/5.1.0 (Linux; Android 12) curl/8.0.0',
    customTvgUrl: 'https://avkb.short.gy/jioepg.xml.gz',
    publicBaseUrl: '',
    zeotvStripSuffix: true,
    zeotvRemoveGroupLogo: false,
    appTitle: 'Nexus Empire',
    dedupMode: 'smart',
  };
  public lastSyncTime: Date | null = null;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadData();
    this.init();
  }

  private loadData() {
    if (fs.existsSync(CUSTOMIZATIONS_FILE)) {
      try {
        const data: CustomizationData = JSON.parse(fs.readFileSync(CUSTOMIZATIONS_FILE, 'utf-8'));
        if (data.sources) this.sources = data.sources;
        if (data.channelOverrides) this.channelOverrides = data.channelOverrides;
        if (data.settings) this.settings = { ...this.settings, ...data.settings };
        if (data.nexusempireItems) this.nexusempireItems = data.nexusempireItems;
      } catch (e) {
        console.error('Failed to load customizations:', e);
      }
    }
    if (fs.existsSync(CACHE_FILE)) {
      try {
        const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        this.channelsBySource = cache.channelsBySource || {};
        this.lastSyncTime = cache.lastSyncTime ? new Date(cache.lastSyncTime) : null;
      } catch (e) {
        console.error('Failed to load cache:', e);
      }
    }
  }

  private saveData() {
    const data: CustomizationData = {
      sources: this.sources,
      channelOverrides: this.channelOverrides,
      groupRenames: {},
      groupLogos: {},
      groupVisibility: {},
      customChannels: [],
      settings: this.settings,
      nexusempireItems: this.nexusempireItems,
    };
    fs.writeFileSync(CUSTOMIZATIONS_FILE, JSON.stringify(data, null, 2));
    
    const cache = {
      channelsBySource: this.channelsBySource,
      lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : null,
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
  }

  public async init() {
    this.scheduleSync();
    if (!this.lastSyncTime) {
      await this.syncAll();
    }
  }

  public scheduleSync() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    if (this.settings.autoSync) {
      this.syncTimer = setInterval(() => this.syncAll(), this.settings.syncIntervalMinutes * 60 * 1000);
    }
  }

  public async syncAll() {
    console.log('[Sync] Starting background sync...');
    for (const source of this.sources) {
      if (source.enabled) {
        await this.syncSource(source.id);
      }
    }
    this.lastSyncTime = new Date();
    this.saveData();
    console.log('[Sync] Completed.');
  }

  public async syncSource(sourceId: string) {
    const source = this.sources.find(s => s.id === sourceId);
    if (!source) return;

    source.status = 'fetching';
    try {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': this.settings.userAgent }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const { channels } = parseM3U(text, sourceId);
      
      this.channelsBySource[sourceId] = channels;
      source.channelCount = channels.length;
      source.lastSyncTime = new Date().toISOString();
      source.status = 'success';
      source.errorMessage = null;
    } catch (e: any) {
      source.status = 'error';
      source.errorMessage = e.message;
      console.error(`[Sync] Failed source ${source.name}:`, e);
    }
  }

  public getAllChannels(dedup = true): ChannelItem[] {
    let all: ChannelItem[] = [];
    for (const sourceId in this.channelsBySource) {
      const source = this.sources.find(s => s.id === sourceId);
      if (source?.enabled) {
        all = all.concat(this.channelsBySource[sourceId]);
      }
    }

    // Apply overrides
    all = all.map(ch => {
      const override = this.channelOverrides[ch.id];
      if (override) {
        return { ...ch, ...override };
      }
      return ch;
    });

    if (dedup && this.settings.dedupMode !== 'off') {
      return deduplicateChannelList(all, { mode: this.settings.dedupMode }).channels;
    }
    return all;
  }

  public generateM3U(channels: ChannelItem[], title = 'Nexus Empire'): string {
    const lines = [
      '#EXTM3U url-tvg="' + this.settings.customTvgUrl + '" x-tvg-url="' + this.settings.customTvgUrl + '" refresh="1800"',
      `# ${title} | Generated ${new Date().toISOString()}`,
      '# Powered by Nexus Empire Engine'
    ];

    for (const ch of channels) {
      if (!ch.enabled) continue;
      
      if (ch.preDirectives) lines.push(...ch.preDirectives);
      
      const logo = ch.customLogo || ch.tvgLogo || '';
      const group = ch.customGroup || ch.groupTitle;
      const name = ch.customName || ch.name;
      
      let inf = `#EXTINF:-1 tvg-id="${ch.tvgId || ''}" tvg-name="${ch.tvgName || name}" tvg-logo="${logo}" group-title="${group}"`;
      if (ch.tvgChno) inf += ` tvg-chno="${ch.tvgChno}"`;
      if (ch.groupLogo) inf += ` group-logo="${ch.groupLogo}"`;
      
      lines.push(`${inf},${name}`);
      
      if (ch.directives) lines.push(...ch.directives);
      
      let streamUrl = ch.customUrl || ch.url;
      // If we have a public base URL, we could potentially proxy or rewrite, 
      // but for now we just use the provided URL.
      lines.push(streamUrl);
    }
    return lines.join('\n');
  }
}

class RebuildService {
  private playlists: RebuiltPlaylist[] = [];

  constructor() {
    this.load();
  }

  private load() {
    if (fs.existsSync(REBUILT_FILE)) {
      try {
        this.playlists = JSON.parse(fs.readFileSync(REBUILT_FILE, 'utf-8'));
      } catch (e) {
        console.error('Failed to load rebuilt playlists:', e);
      }
    }
  }

  private save() {
    fs.writeFileSync(REBUILT_FILE, JSON.stringify(this.playlists, null, 2));
  }

  public getAll() { return this.playlists; }
  public getById(id: string) { return this.playlists.find(p => p.id === id || p.slug === id); }
  
  public create(data: Partial<RebuiltPlaylist>) {
    const p: RebuiltPlaylist = {
      id: `rb_${Date.now()}`,
      slug: data.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'custom',
      name: data.name || 'Untitled',
      description: data.description || '',
      targetType: 'normal',
      targetSourceOrCategory: 'all',
      customCategories: data.customCategories || { 'General': [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.playlists.push(p);
    this.save();
    return p;
  }

  public update(id: string, updates: Partial<RebuiltPlaylist>) {
    const p = this.playlists.find(x => x.id === id);
    if (p) {
      Object.assign(p, updates);
      p.updatedAt = new Date().toISOString();
      this.save();
    }
    return p;
  }

  public delete(id: string) {
    this.playlists = this.playlists.filter(p => p.id !== id);
    this.save();
  }
}

const playlistService = new PlaylistService();
const rebuildService = new RebuildService();

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    lastSync: playlistService.lastSyncTime,
    sources: playlistService.sources,
    nexusempire: playlistService.nexusempireItems,
  });
});

app.get('/api/channels', (req, res) => {
  res.json(playlistService.getAllChannels());
});

app.post('/api/sync', async (req, res) => {
  await playlistService.syncAll();
  res.json({ success: true });
});

app.post('/api/channels/:id/override', (req, res) => {
  const { id } = req.params;
  playlistService.channelOverrides[id] = { ...playlistService.channelOverrides[id], ...req.body };
  res.json({ success: true });
});

// Nexus Empire Endpoints
app.get('/api/nexusempire', (req, res) => {
  res.json(playlistService.nexusempireItems);
});

app.get('/:slug.m3u', (req, res) => {
  const { slug } = req.params;
  
  // Check if it's a Nexus Empire item
  const neItem = playlistService.nexusempireItems.find(i => i.slug === slug || i.m3uSlug === slug);
  if (neItem) {
    const lines = [
      '#EXTM3U',
      `# ${neItem.name} | Streambox Protocol`,
      `#EXTINF:-1 tvg-logo="${neItem.logo}" group-title="Nexus Empire",${neItem.name}`,
      neItem.uri
    ];
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    return res.send(lines.join('\n'));
  }

  // Check if it's a rebuilt playlist
  const rebuilt = rebuildService.getById(slug);
  if (rebuilt) {
    const channels = playlistService.getAllChannels();
    const m3u = playlistService.generateM3U(channels.filter(c => {
      return Object.values(rebuilt.customCategories).flat().includes(c.id);
    }), rebuilt.name);
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    return res.send(m3u);
  }

  if (slug === 'all') {
    const m3u = playlistService.generateM3U(playlistService.getAllChannels());
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    return res.send(m3u);
  }

  res.status(404).send('Playlist not found');
});

// Rebuild Endpoints
app.get('/api/rebuild', (req, res) => res.json(rebuildService.getAll()));
app.post('/api/rebuild', (req, res) => res.json(rebuildService.create(req.body)));
app.put('/api/rebuild/:id', (req, res) => res.json(rebuildService.update(req.params.id, req.body)));
app.delete('/api/rebuild/:id', (req, res) => {
  rebuildService.delete(req.params.id);
  res.json({ success: true });
});

// External JSON Data Endpoints
app.get('/api/external/fancode', async (req, res) => {
  try {
    const response = await fetch('https://raw.githubusercontent.com/doctor-8trange/zyphx8/refs/heads/main/data/fancode.json');
    const data = await response.json();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/external/sony', async (req, res) => {
  try {
    const response = await fetch('https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.json');
    const data = await response.json();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/external/zee5', async (req, res) => {
  try {
    const response = await fetch('https://raw.githubusercontent.com/doctor-8trange/quarnex/refs/heads/main/data/zee5.json');
    const data = await response.json();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Vite middleware
const isProd = process.env.NODE_ENV === 'production';
if (!isProd) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static('dist'));
  app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, 'dist', 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

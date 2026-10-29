import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  ChannelStream,
  PlaylistSource,
  RebuildCategory,
  DuplicateCluster,
  AppSettings,
  CloudStreamItem,
  SkyStreamItem,
  StremioAddon,
} from './src/types/playlist';
import { parseM3U, parseEventJSON, buildM3U } from './src/utils/m3uParser';
import { detectDuplicates } from './src/utils/duplicateDetector';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// App Settings with user domain thenexusempire.com and port 8443 stripping
let appSettings: AppSettings = {
  domain: 'thenexusempire.com',
  port: 8443,
  hidePort: true, // Hide port 8443 so M3U URLs use clean https://thenexusempire.com/...
  publicBaseUrl: 'https://thenexusempire.com',
  customTvgUrl: 'https://thenexusempire.com/epg.xml',
  syncIntervalMinutes: 15,
  autoSync: true,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 TiviMate/4.7.0',
};

// Helper to determine the public base URL
export function getPublicBaseUrl(req?: Request): string {
  if (appSettings.publicBaseUrl && appSettings.publicBaseUrl.trim()) {
    return appSettings.publicBaseUrl.trim().replace(/\/+$/, '');
  }

  if (req) {
    const forwardedProto = (req.headers['x-forwarded-proto'] as string) || 'https';
    let host = (req.headers['x-forwarded-host'] as string) || req.headers.host || appSettings.domain;

    if (appSettings.hidePort) {
      // Remove any :8443 or :3000 port suffix so it matches clean domain
      host = host.split(':')[0];
    }
    return `${forwardedProto}://${host}`;
  }

  return `https://${appSettings.domain}`;
}

// Initial Default Sources including SunNXT / StreamX from old repo
let playlistSources: PlaylistSource[] = [
  {
    id: 'src-1',
    name: 'TiviMate Cloudflare Hub',
    slug: 'tivimate',
    url: 'https://hjh-545.pages.dev/',
    type: 'm3u',
    category: 'global',
    channelCount: 0,
    status: 'idle',
    autoRefresh: true,
  },
  {
    id: 'src-2',
    name: 'Plug VIP Playlist',
    slug: 'plugx',
    url: 'https://plugxvipplaylist.lovable.app/api/playlist',
    type: 'm3u',
    category: 'global',
    channelCount: 0,
    status: 'idle',
    autoRefresh: true,
  },
  {
    id: 'src-3',
    name: 'StalkMax Workers M3U',
    slug: 'stalkmax',
    url: 'https://stalkmax.7henexusempire.workers.dev/playlist.m3u?pass=Nexus07',
    type: 'm3u',
    category: 'global',
    channelCount: 0,
    status: 'idle',
    autoRefresh: true,
  },
  {
    id: 'src-4',
    name: 'P1 Stalk Workers M3U',
    slug: 'p1stalk',
    url: 'https://p1stalk.7henexusempire.workers.dev/playlist.m3u?pass=Nexus07',
    type: 'm3u',
    category: 'global',
    channelCount: 0,
    status: 'idle',
    autoRefresh: true,
  },
  {
    id: 'src-5',
    name: 'Server LRL45 Raw',
    slug: 'server-lrl45',
    url: 'https://server.lrl45.workers.dev/channel/raw?=m3u',
    type: 'm3u',
    category: 'global',
    channelCount: 0,
    status: 'idle',
    autoRefresh: true,
  },
  {
    id: 'src-6',
    name: 'P1 Stalk PHP Streamer',
    slug: 'p1php',
    url: 'https://p1stalk.7henexusempire.workers.dev/playlist.php?pass=Nexus07',
    type: 'm3u',
    category: 'global',
    channelCount: 0,
    status: 'idle',
    autoRefresh: true,
  },
  {
    id: 'src-zeotv',
    name: 'SunNXT & StreamX Live',
    slug: 'zeotv',
    url: 'https://zeotvyash.streamxlivenow.workers.dev/',
    type: 'm3u',
    category: 'global',
    channelCount: 0,
    status: 'idle',
    autoRefresh: true,
  },
  // Nexus Empire Streambox sources
  {
    id: 'src-streambox',
    name: 'Nexus Empire Streambox Vault',
    slug: 'nexus-vault',
    url: 'streambox://vault',
    type: 'streambox',
    category: 'nexus',
    channelCount: 5,
    status: 'online',
    autoRefresh: true,
  },
  // Event sources
  {
    id: 'src-fancode-m3u',
    name: 'Fancode Live M3U',
    slug: 'fancode-live',
    url: 'https://raw.githubusercontent.com/doctor-8trange/zyphx8/refs/heads/main/data/fancode.m3u',
    backupUrl: 'https://raw.githubusercontent.com/drmlive/fancode-live-events/refs/heads/main/fancode.json',
    type: 'm3u',
    category: 'events',
    channelCount: 0,
    status: 'idle',
    autoRefresh: true,
  },
  {
    id: 'src-fancode-json',
    name: 'Fancode Events JSON',
    slug: 'fancode-events',
    url: 'https://raw.githubusercontent.com/doctor-8trange/zyphx8/refs/heads/main/data/fancode.json',
    backupUrl: 'https://raw.githubusercontent.com/drmlive/fancode-live-events/refs/heads/main/fancode.json',
    type: 'json',
    category: 'events',
    channelCount: 0,
    status: 'idle',
    autoRefresh: true,
  },
  {
    id: 'src-sony-m3u',
    name: 'SonyLIV Live M3U',
    slug: 'sony-live',
    url: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.m3u',
    backupUrl: 'https://raw.githubusercontent.com/drmlive/sliv-live-events/refs/heads/main/sonyliv.m3u',
    type: 'm3u',
    category: 'events',
    channelCount: 0,
    status: 'idle',
    autoRefresh: true,
  },
  {
    id: 'src-sony-json',
    name: 'SonyLIV Events JSON',
    slug: 'sony-events',
    url: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.json',
    backupUrl: 'https://raw.githubusercontent.com/drmlive/sliv-live-events/refs/heads/main/sonyliv.json',
    type: 'json',
    category: 'events',
    channelCount: 0,
    status: 'idle',
    autoRefresh: true,
  },
  {
    id: 'src-zee5-m3u',
    name: 'Zee5 Live M3U',
    slug: 'zee5-live',
    url: 'https://raw.githubusercontent.com/doctor-8trange/quarnex/refs/heads/main/data/zee5.m3u',
    type: 'm3u',
    category: 'events',
    channelCount: 0,
    status: 'idle',
    autoRefresh: true,
  },
  {
    id: 'src-zee5-json',
    name: 'Zee5 Events JSON',
    slug: 'zee5-events',
    url: 'https://raw.githubusercontent.com/doctor-8trange/quarnex/refs/heads/main/data/zee5.json',
    type: 'json',
    category: 'events',
    channelCount: 0,
    status: 'idle',
    autoRefresh: true,
  },
];

// Initial Streambox Channels (AniTV / Streambox compatible)
const INITIAL_STREAMBOX_CHANNELS: ChannelStream[] = [
  {
    id: 'sb-1',
    title: 'Nexus Streambox Stream 1 [AniTV Live]',
    url: 'streambox://open/255cfab9f98da87dab11a6e0a337279e',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547',
    group: 'Nexus Empire VIP',
    tvgId: 'streambox.nexus.1',
    tvgName: 'Nexus Streambox 1',
    sourceId: 'src-streambox',
    sourceName: 'Nexus Empire Streambox Vault',
    status: 'active',
    serverSignature: 'streambox',
    addedAt: Date.now(),
  },
  {
    id: 'sb-2',
    title: 'Nexus Streambox Stream 2 [AniTV Cinema]',
    url: 'streambox://open/dbd3d88df5fe1594d5d64afb3b6704be',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547',
    group: 'Nexus Empire Cinema',
    tvgId: 'streambox.nexus.2',
    tvgName: 'Nexus Streambox 2',
    sourceId: 'src-streambox',
    sourceName: 'Nexus Empire Streambox Vault',
    status: 'active',
    serverSignature: 'streambox',
    addedAt: Date.now(),
  },
  {
    id: 'sb-3',
    title: 'Nexus Streambox Stream 3 [AniTV Ultra]',
    url: 'streambox://open/4397be6aa83e687053eeb1f55b4f9f48',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547',
    group: 'Nexus Empire Sports',
    tvgId: 'streambox.nexus.3',
    tvgName: 'Nexus Streambox 3',
    sourceId: 'src-streambox',
    sourceName: 'Nexus Empire Streambox Vault',
    status: 'active',
    serverSignature: 'streambox',
    addedAt: Date.now(),
  },
  {
    id: 'sb-4',
    title: 'Nexus Streambox Stream 4 [AniTV Max]',
    url: 'streambox://open/188140cf39bd8728cfa2f19290218e2b',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547',
    group: 'Nexus Empire VIP',
    tvgId: 'streambox.nexus.4',
    tvgName: 'Nexus Streambox 4',
    sourceId: 'src-streambox',
    sourceName: 'Nexus Empire Streambox Vault',
    status: 'active',
    serverSignature: 'streambox',
    addedAt: Date.now(),
  },
  {
    id: 'sb-5',
    title: 'Nexus Streambox Stream 5 [AniTV Prime]',
    url: 'streambox://open/8003bfd97ec3d87c8df2280494c3aa26',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547',
    group: 'Nexus Empire Prime',
    tvgId: 'streambox.nexus.5',
    tvgName: 'Nexus Streambox 5',
    sourceId: 'src-streambox',
    sourceName: 'Nexus Empire Streambox Vault',
    status: 'active',
    serverSignature: 'streambox',
    addedAt: Date.now(),
  },
];

// In-Memory Storage
let channelDatabase: ChannelStream[] = [...INITIAL_STREAMBOX_CHANNELS];
let rebuildCategories: RebuildCategory[] = [
  { id: 'cat-1', name: '👑 Nexus VIP & Sports', slug: 'vip-sports', order: 1, channelIds: ['sb-1', 'sb-3'] },
  { id: 'cat-2', name: '🎬 Nexus Cinema & Entertainment', slug: 'cinema', order: 2, channelIds: ['sb-2', 'sb-4', 'sb-5'] },
];

// CloudStream, SkyStream, Stremio state loaded from data directory
let cloudstreamItems: CloudStreamItem[] = [];
let skystreamItems: SkyStreamItem[] = [];
let stremioAddons: StremioAddon[] = [
  {
    id: 'cinemeta',
    name: 'Cinemeta (Official)',
    version: '3.0.12',
    description: 'Official Stremio & Nuvio catalog metadata for Movies, TV Series and Anime',
    manifestUrl: 'https://v3-cinemeta.strem.io/manifest.json',
    logo: 'https://images.metahub.space/logo/medium/cinemeta.png',
    types: ['movie', 'series', 'anime'],
    enabled: true,
  },
  {
    id: 'opensubtitles',
    name: 'OpenSubtitles v3',
    version: '1.0.0',
    description: 'Official multi-language subtitles for movies and TV shows',
    manifestUrl: 'https://opensubtitles-v3.strem.io/manifest.json',
    logo: 'https://images.metahub.space/logo/medium/opensubtitles.png',
    types: ['movie', 'series'],
    enabled: true,
  },
  {
    id: 'torrentio',
    name: 'Torrentio Lite',
    version: '1.0.14',
    description: 'Streams torrents from multiple providers with debrid integration',
    manifestUrl: 'https://torrentio.strem.fun/manifest.json',
    logo: 'https://torrentio.strem.fun/logo.png',
    types: ['movie', 'series'],
    enabled: true,
  },
];

// Load catalog data if available
try {
  const csPath = path.join(DATA_DIR, 'cloudstream-repos.json');
  if (fs.existsSync(csPath)) {
    const csData = JSON.parse(fs.readFileSync(csPath, 'utf8'));
    if (csData.items) cloudstreamItems = csData.items;
  }

  const skyPath = path.join(DATA_DIR, 'skystream-extensions.json');
  if (fs.existsSync(skyPath)) {
    const skyData = JSON.parse(fs.readFileSync(skyPath, 'utf8'));
    if (skyData.repos) {
      skystreamItems = skyData.repos.map((r: any) => ({
        id: r.id,
        name: r.name,
        version: r.rawPayload?.version ? String(r.rawPayload.version) : '1.0',
        author: r.rawPayload?.authors?.[0] || 'SkyStream Developer',
        description: r.description || 'SkyStream extension module',
        url: r.url,
        category: r.rawPayload?.categories?.[0] || 'General',
        enabled: true,
      }));
    }
  }
} catch (e) {
  console.warn('Could not load catalog data:', e);
}

let lastGlobalFetchTimestamp = Date.now();
const AUTO_FETCH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
let nextScheduledFetchTimestamp = lastGlobalFetchTimestamp + AUTO_FETCH_INTERVAL_MS;
let isFetchingActive = false;

// Helper to fetch from remote URL with headers and timeouts
async function fetchRemoteData(url: string, headers?: Record<string, string>): Promise<{ text: string; contentType: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': appSettings.userAgent,
        'Accept': '*/*',
        ...(headers || {}),
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    return { text, contentType };
  } catch (err: any) {
    clearTimeout(timeout);
    throw err;
  }
}

// Fetch single playlist source
async function fetchSource(source: PlaylistSource): Promise<ChannelStream[]> {
  if (source.type === 'streambox') {
    return channelDatabase.filter((c) => c.sourceId === source.id);
  }

  let raw = '';
  let contentType = '';
  let fetchError = '';

  try {
    const result = await fetchRemoteData(source.url, source.headers);
    raw = result.text;
    contentType = result.contentType;
  } catch (primaryErr: any) {
    fetchError = primaryErr.message;
    if (source.backupUrl) {
      try {
        const backupResult = await fetchRemoteData(source.backupUrl, source.headers);
        raw = backupResult.text;
        contentType = backupResult.contentType;
        fetchError = '';
      } catch (backupErr: any) {
        fetchError = `Primary and backup failed: ${primaryErr.message} / ${backupErr.message}`;
      }
    }
  }

  if (fetchError || !raw) {
    source.status = 'error';
    source.error = fetchError || 'Empty content received';
    return [];
  }

  source.status = 'online';
  source.error = undefined;
  source.lastFetched = new Date().toISOString();

  let parsedChannels: ChannelStream[] = [];

  if (source.type === 'json' || raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
    try {
      const parsedJson = JSON.parse(raw);
      parsedChannels = parseEventJSON(parsedJson, source.id, source.name);
    } catch {
      parsedChannels = parseM3U(raw, source.id, source.name);
    }
  } else {
    parsedChannels = parseM3U(raw, source.id, source.name);
  }

  source.channelCount = parsedChannels.length;
  return parsedChannels;
}

// Refresh all sources concurrently with fast settlement
async function refreshAllSources() {
  if (isFetchingActive) return;
  isFetchingActive = true;

  try {
    console.log('[Nexus Fetcher] Starting parallel auto-fetch for all sources...');
    
    const activeSources = playlistSources.filter((s) => s.type !== 'streambox' && s.autoRefresh);
    activeSources.forEach((s) => {
      s.status = 'fetching';
    });

    const results = await Promise.allSettled(
      activeSources.map(async (source) => {
        try {
          const channels = await fetchSource(source);
          return { sourceId: source.id, channels };
        } catch (err: any) {
          source.status = 'error';
          source.error = err.message;
          return { sourceId: source.id, channels: [] };
        }
      })
    );

    const newDatabase: ChannelStream[] = [...INITIAL_STREAMBOX_CHANNELS];

    for (const res of results) {
      if (res.status === 'fulfilled' && res.value.channels) {
        newDatabase.push(...res.value.channels);
      }
    }

    const customUserStreams = channelDatabase.filter((c) => c.sourceId === 'src-custom');
    newDatabase.push(...customUserStreams);

    // 1. Create maps for overrides and trashed status
    const overridesMap = new Map<string, Partial<ChannelStream>>();
    const trashedUrls = new Set<string>();

    channelDatabase.forEach((c) => {
      if (c.status === 'trashed') {
        trashedUrls.add(c.url);
      }
      if (c.customName || c.customGroup || c.customLogo || c.customUrl || c.customChno) {
        overridesMap.set(c.url, {
          customName: c.customName,
          customGroup: c.customGroup,
          customLogo: c.customLogo,
          customUrl: c.customUrl,
          customChno: c.customChno,
        });
      }
    });

    // 2. Apply them to the new database
    newDatabase.forEach((ch) => {
      if (trashedUrls.has(ch.url)) {
        ch.status = 'trashed';
      }
      const overrides = overridesMap.get(ch.url);
      if (overrides) {
        Object.assign(ch, overrides);
      }
    });

    channelDatabase = newDatabase;
    lastGlobalFetchTimestamp = Date.now();
    nextScheduledFetchTimestamp = lastGlobalFetchTimestamp + AUTO_FETCH_INTERVAL_MS;
    console.log(`[Nexus Fetcher] Parallel fetch complete. Total active streams: ${channelDatabase.length}`);
  } finally {
    isFetchingActive = false;
  }
}

// Start 15-minute cron timer
setInterval(() => {
  refreshAllSources().catch((err) => console.error('[Nexus Fetcher] Cron Error:', err));
}, AUTO_FETCH_INTERVAL_MS);

// Initial bootstrap fetch
setTimeout(() => {
  refreshAllSources().catch((err) => console.error('[Nexus Fetcher] Bootstrap Error:', err));
}, 1000);

// ======================== API ROUTES ======================== //

// 1. Status & Configuration
app.get('/api/status', (req, res) => {
  res.json({
    appName: 'Nexus Empire',
    version: '2.5.0',
    domain: appSettings.domain,
    port: appSettings.port,
    publicBaseUrl: getPublicBaseUrl(req),
    hidePort: appSettings.hidePort,
    totalChannels: channelDatabase.filter((c) => c.status !== 'trashed').length,
    trashedChannels: channelDatabase.filter((c) => c.status === 'trashed').length,
    totalSources: playlistSources.length,
    lastGlobalFetch: lastGlobalFetchTimestamp,
    nextScheduledFetch: nextScheduledFetchTimestamp,
    isFetching: isFetchingActive,
    autoFetchIntervalMinutes: appSettings.syncIntervalMinutes,
  });
});

app.get('/api/settings', (req, res) => {
  res.json(appSettings);
});

app.put('/api/settings', (req, res) => {
  appSettings = {
    ...appSettings,
    ...req.body,
  };
  res.json(appSettings);
});

// 2. Playlists Sources CRUD (with custom slugs & rename)
app.get('/api/playlists', (req, res) => {
  res.json(playlistSources);
});

app.post('/api/playlists', (req, res) => {
  const { name, url, slug, type, category, backupUrl, headers } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required' });
  }

  const generatedSlug = slug
    ? slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
    : name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  const newSource: PlaylistSource = {
    id: `src-${Date.now()}`,
    name,
    slug: generatedSlug,
    url,
    backupUrl,
    type: type || 'm3u',
    category: category || 'custom',
    channelCount: 0,
    status: 'idle',
    autoRefresh: true,
    headers,
  };

  playlistSources.push(newSource);
  fetchSource(newSource)
    .then((channels) => {
      channelDatabase.push(...channels);
    })
    .catch((err) => console.error('Error fetching new playlist:', err));

  res.status(201).json(newSource);
});

app.put('/api/playlists/:id', (req, res) => {
  const { id } = req.params;
  const index = playlistSources.findIndex((s) => s.id === id);
  if (index === -1) return res.status(404).json({ error: 'Source not found' });

  playlistSources[index] = {
    ...playlistSources[index],
    ...req.body,
    id,
  };

  res.json(playlistSources[index]);
});

app.delete('/api/playlists/:id', (req, res) => {
  const { id } = req.params;
  playlistSources = playlistSources.filter((s) => s.id !== id);
  channelDatabase = channelDatabase.filter((c) => c.sourceId !== id);
  res.json({ success: true, message: 'Source deleted' });
});

// Manual Fetch All
app.post('/api/playlists/fetch-all', async (req, res) => {
  await refreshAllSources();
  res.json({
    success: true,
    totalChannels: channelDatabase.length,
    lastFetched: lastGlobalFetchTimestamp,
  });
});

// Manual Fetch Specific Source
app.post('/api/playlists/:id/fetch', async (req, res) => {
  const { id } = req.params;
  const source = playlistSources.find((s) => s.id === id);
  if (!source) return res.status(404).json({ error: 'Source not found' });

  source.status = 'fetching';
  try {
    const channels = await fetchSource(source);
    channelDatabase = channelDatabase.filter((c) => c.sourceId !== id).concat(channels);
    res.json({ success: true, source, channelCount: channels.length });
  } catch (err: any) {
    source.status = 'error';
    source.error = err.message;
    res.status(500).json({ error: err.message });
  }
});

// 3. Category & Group Management (Rename, Bulk Logo, Remove Prefix, Toggle)
app.get('/api/groups', (req, res) => {
  const groupCounts = new Map<string, number>();
  channelDatabase.forEach((ch) => {
    if (ch.status !== 'trashed') {
      const g = ch.customGroup || ch.group || 'General';
      groupCounts.set(g, (groupCounts.get(g) || 0) + 1);
    }
  });

  const list = Array.from(groupCounts.entries()).map(([name, count]) => ({
    name,
    count,
    logo: channelDatabase.find((c) => (c.customGroup || c.group) === name)?.logo,
  }));

  res.json(list);
});

// Rename category across all streams
app.post('/api/groups/rename', (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).json({ error: 'oldName and newName required' });

  let updatedCount = 0;
  channelDatabase.forEach((ch) => {
    const currentG = ch.customGroup || ch.group;
    if (currentG === oldName) {
      ch.group = newName.trim();
      ch.customGroup = newName.trim();
      updatedCount++;
    }
  });

  res.json({ success: true, updatedCount, oldName, newName });
});

// Bulk set logo for all streams in a category
app.post('/api/groups/bulk-logo', (req, res) => {
  const { groupName, logoUrl } = req.body;
  if (!groupName || !logoUrl) return res.status(400).json({ error: 'groupName and logoUrl required' });

  let updatedCount = 0;
  channelDatabase.forEach((ch) => {
    const currentG = ch.customGroup || ch.group;
    if (currentG === groupName) {
      ch.logo = logoUrl.trim();
      ch.customLogo = logoUrl.trim();
      updatedCount++;
    }
  });

  res.json({ success: true, updatedCount, groupName, logoUrl });
});

// Strip category prefix (e.g. Jio TV+ | , [IN], HD -)
app.post('/api/groups/remove-prefix', (req, res) => {
  const { prefix } = req.body;
  if (!prefix) return res.status(400).json({ error: 'prefix required' });

  let updatedCount = 0;
  channelDatabase.forEach((ch) => {
    const currentG = ch.customGroup || ch.group || '';
    if (currentG.startsWith(prefix)) {
      const newG = currentG.substring(prefix.length).trim() || 'General';
      ch.group = newG;
      ch.customGroup = newG;
      updatedCount++;
    }
  });

  res.json({ success: true, updatedCount });
});

// Delete category (move channels to General or delete)
app.post('/api/groups/delete', (req, res) => {
  const { groupName, deleteChannels } = req.body;
  if (!groupName) return res.status(400).json({ error: 'groupName required' });

  let affectedCount = 0;
  if (deleteChannels) {
    channelDatabase = channelDatabase.filter((c) => (c.customGroup || c.group) !== groupName);
  } else {
    channelDatabase.forEach((c) => {
      if ((c.customGroup || c.group) === groupName) {
        c.group = 'General';
        c.customGroup = 'General';
        affectedCount++;
      }
    });
  }

  res.json({ success: true, affectedCount });
});

// 4. Channels & Streams CRUD
app.get('/api/channels', (req, res) => {
  // Alias for /api/streams
  handleStreamsQuery(req, res);
});

app.get('/api/streams', (req, res) => {
  handleStreamsQuery(req, res);
});

function handleStreamsQuery(req: Request, res: Response) {
  const { group, search, sourceId, status, limit, offset } = req.query;

  let filtered = [...channelDatabase];

  if (status) {
    filtered = filtered.filter((c) => c.status === status);
  } else {
    filtered = filtered.filter((c) => c.status !== 'trashed');
  }

  if (sourceId) {
    filtered = filtered.filter((c) => c.sourceId === sourceId);
  }

  if (group && group !== 'ALL') {
    filtered = filtered.filter((c) => (c.customGroup || c.group) === group);
  }

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(
      (c) =>
        (c.customName || c.title).toLowerCase().includes(q) ||
        (c.customGroup || c.group || '').toLowerCase().includes(q) ||
        (c.tvgName || c.tvgId || '').toLowerCase().includes(q) ||
        (c.customUrl || c.url).toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const parsedLimit = limit ? parseInt(String(limit)) : 5000;
  const parsedOffset = offset ? parseInt(String(offset)) : 0;

  const paginated = filtered.slice(parsedOffset, parsedOffset + parsedLimit);

  res.json({
    total,
    channels: paginated,
    limit: parsedLimit,
    offset: parsedOffset,
  });
}

// Update stream
app.put('/api/streams/:id', (req, res) => {
  const { id } = req.params;
  const index = channelDatabase.findIndex((c) => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Stream not found' });

  channelDatabase[index] = {
    ...channelDatabase[index],
    ...req.body,
    id,
  };

  res.json(channelDatabase[index]);
});

// Add custom stream
app.post('/api/streams', (req, res) => {
  const { title, url, group, logo, tvgId, tvgName, chno, headers } = req.body;
  if (!title || !url) return res.status(400).json({ error: 'Title and URL are required' });

  const newChannel: ChannelStream = {
    id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title,
    url,
    group: group || 'Custom',
    logo,
    tvgId,
    tvgName: tvgName || title,
    chno,
    sourceId: 'src-custom',
    sourceName: 'Nexus Custom Streams',
    headers,
    status: 'active',
    addedAt: Date.now(),
  };

  channelDatabase.unshift(newChannel);
  res.status(201).json(newChannel);
});

// Delete stream (or move to trash)
app.delete('/api/streams/:id', (req, res) => {
  const { id } = req.params;
  const permanent = req.query.permanent === 'true';

  if (permanent) {
    channelDatabase = channelDatabase.filter((c) => c.id !== id);
    res.json({ success: true, message: 'Permanently deleted' });
  } else {
    const ch = channelDatabase.find((c) => c.id === id);
    if (ch) {
      ch.status = 'trashed';
      res.json({ success: true, message: 'Moved to trash', channel: ch });
    } else {
      res.status(404).json({ error: 'Stream not found' });
    }
  }
});

// Restore stream from trash
app.post('/api/streams/:id/restore', (req, res) => {
  const { id } = req.params;
  const ch = channelDatabase.find((c) => c.id === id);
  if (!ch) return res.status(404).json({ error: 'Stream not found' });

  ch.status = 'active';
  res.json({ success: true, message: 'Restored to active', channel: ch });
});

// Empty trash
app.post('/api/trash/empty', (req, res) => {
  const beforeCount = channelDatabase.length;
  channelDatabase = channelDatabase.filter((c) => c.status !== 'trashed');
  const removed = beforeCount - channelDatabase.length;
  res.json({ success: true, removedCount: removed });
});

// 5. Rebuild Custom Playlists Endpoints
app.get('/api/rebuild/categories', (req, res) => {
  res.json(rebuildCategories);
});

app.post('/api/rebuild/categories', (req, res) => {
  const { name, slug } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const generatedSlug = slug
    ? slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
    : name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  const newCat: RebuildCategory = {
    id: `cat-${Date.now()}`,
    name,
    slug: generatedSlug,
    order: rebuildCategories.length + 1,
    channelIds: [],
  };

  rebuildCategories.push(newCat);
  res.status(201).json(newCat);
});

app.put('/api/rebuild/categories/:id', (req, res) => {
  const { id } = req.params;
  const index = rebuildCategories.findIndex((c) => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Category not found' });

  rebuildCategories[index] = {
    ...rebuildCategories[index],
    ...req.body,
    id,
  };
  res.json(rebuildCategories[index]);
});

app.delete('/api/rebuild/categories/:id', (req, res) => {
  const { id } = req.params;
  rebuildCategories = rebuildCategories.filter((c) => c.id !== id);
  res.json({ success: true, message: 'Category removed' });
});

app.post('/api/rebuild/add-stream', (req, res) => {
  const { categoryId, channelId } = req.body;
  const cat = rebuildCategories.find((c) => c.id === categoryId);
  if (!cat) return res.status(404).json({ error: 'Category not found' });

  if (!cat.channelIds.includes(channelId)) {
    cat.channelIds.push(channelId);
  }
  res.json(cat);
});

app.post('/api/rebuild/remove-stream', (req, res) => {
  const { categoryId, channelId } = req.body;
  const cat = rebuildCategories.find((c) => c.id === categoryId);
  if (!cat) return res.status(404).json({ error: 'Category not found' });

  cat.channelIds = cat.channelIds.filter((id) => id !== channelId);
  res.json(cat);
});

// 6. AI Deduplication
app.post('/api/ai/deduplicate', async (req, res) => {
  try {
    const { useAiModel } = req.body;
    const baseResult = detectDuplicates(channelDatabase);

    if (useAiModel && process.env.GEMINI_API_KEY && baseResult.clusters.length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const sampleClusters = baseResult.clusters.slice(0, 8);
        const prompt = `You are an IPTV & streaming network engineer for Nexus Empire.
Analyze these streaming channel duplicate clusters. Check if the streams are true duplicates or distinct server mirrors (alternate CDNs/backup servers).
Clusters: ${JSON.stringify(sampleClusters, null, 2)}

Return a concise JSON object with:
{
  "analyzed": [
    {
      "clusterId": "...",
      "aiRecommendation": "KEEP" or "QUARANTINE_DUPLICATE",
      "explanation": "concise explanation of whether it's same server feed or alternate backup CDN mirror"
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = response.text || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const aiData = JSON.parse(match[0]);
          if (aiData.analyzed && Array.isArray(aiData.analyzed)) {
            const aiMap = new Map(aiData.analyzed.map((a: any) => [a.clusterId, a]));
            baseResult.clusters.forEach((c) => {
              const aiRec = aiMap.get(c.clusterId) as any;
              if (aiRec) {
                c.reason = `${c.reason} [AI Insight: ${aiRec.explanation}]`;
              }
            });
          }
        }
      } catch (aiErr: any) {
        console.warn('[AI Deduplication] Gemini fallback:', aiErr.message);
      }
    }

    res.json(baseResult);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/quarantine-duplicates', (req, res) => {
  const { duplicateIds } = req.body;
  if (!Array.isArray(duplicateIds)) {
    return res.status(400).json({ error: 'duplicateIds must be an array' });
  }

  let movedCount = 0;
  channelDatabase.forEach((ch) => {
    if (duplicateIds.includes(ch.id)) {
      ch.status = 'trashed';
      movedCount++;
    }
  });

  res.json({ success: true, movedToTrash: movedCount });
});

// 7. CloudStream, SkyStream & Stremio Catalogs
app.get('/api/cloudstream/items', (req, res) => {
  res.json(cloudstreamItems);
});

app.get('/api/skystream/extensions', (req, res) => {
  res.json(skystreamItems);
});

app.get('/api/stremio/addons', (req, res) => {
  res.json(stremioAddons);
});

// 8. Full Backup Export & Import
app.get('/api/backup/export', (req, res) => {
  const backup = {
    appName: 'Nexus Empire',
    exportedAt: new Date().toISOString(),
    settings: appSettings,
    sources: playlistSources,
    rebuildCategories,
    customChannels: channelDatabase.filter((c) => c.sourceId === 'src-custom'),
    overrides: channelDatabase
      .filter((c) => c.customName || c.customGroup || c.customLogo || c.customUrl)
      .map((c) => ({
        id: c.id,
        url: c.url,
        customName: c.customName,
        customGroup: c.customGroup,
        customLogo: c.customLogo,
        customUrl: c.customUrl,
      })),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="nexus_empire_backup.json"');
  res.send(JSON.stringify(backup, null, 2));
});

app.post('/api/backup/import', (req, res) => {
  try {
    const data = req.body;
    if (data.settings) appSettings = { ...appSettings, ...data.settings };
    if (data.sources && Array.isArray(data.sources)) playlistSources = data.sources;
    if (data.rebuildCategories && Array.isArray(data.rebuildCategories)) rebuildCategories = data.rebuildCategories;

    res.json({ success: true, message: 'Backup restored successfully' });
  } catch (err: any) {
    res.status(400).json({ error: 'Invalid backup file', details: err.message });
  }
});

// ======================== LIVE HOSTED M3U ENDPOINTS ======================== //

function serveM3UResponse(res: Response, filename: string, channels: ChannelStream[]) {
  // Apply any custom channel overrides
  const mappedChannels = channels.map((c) => ({
    ...c,
    title: c.customName || c.title,
    group: c.customGroup || c.group,
    logo: c.customLogo || c.logo,
    url: c.customUrl || c.url,
  }));

  const m3uContent = buildM3U(mappedChannels, filename.replace(/\.(m3u8?)$/, ''));
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(m3uContent);
}

// 1. Combined All Channels Endpoint
app.get(['/all.m3u', '/all.m3u8', '/combined.m3u', '/combined.m3u8', '/api/playlist/combined.m3u', '/api/playlist/combined.m3u8'], (req, res) => {
  const activeChannels = channelDatabase.filter((c) => c.status !== 'trashed');
  serveM3UResponse(res, 'nexus_combined.m3u', activeChannels);
});

// 2. Streambox / AniTV Vault Endpoint
app.get(['/nexus.m3u', '/nexus.m3u8', '/api/playlist/nexus-empire.m3u', '/api/playlist/nexus-empire.m3u8', '/api/aninexus/all.m3u'], (req, res) => {
  const streamboxChannels = channelDatabase.filter(
    (c) => c.status !== 'trashed' && (c.sourceId === 'src-streambox' || c.url.startsWith('streambox://') || c.group?.toLowerCase().includes('nexus'))
  );
  serveM3UResponse(res, 'nexus_empire_vault.m3u', streamboxChannels);
});

// 3. Fancode Live Sports Endpoint
app.get(['/fancode.m3u', '/fancode.m3u8', '/api/playlist/fancode.m3u', '/api/playlist/fancode.m3u8'], (req, res) => {
  const fancodeChannels = channelDatabase.filter(
    (c) => c.status !== 'trashed' && (c.sourceId.includes('fancode') || c.title.toLowerCase().includes('fancode'))
  );
  serveM3UResponse(res, 'nexus_fancode.m3u', fancodeChannels);
});

// 4. SonyLIV Live Events Endpoint
app.get(['/sony.m3u', '/sony.m3u8', '/api/playlist/sony.m3u', '/api/playlist/sony.m3u8'], (req, res) => {
  const sonyChannels = channelDatabase.filter(
    (c) => c.status !== 'trashed' && (c.sourceId.includes('sony') || c.title.toLowerCase().includes('sony'))
  );
  serveM3UResponse(res, 'nexus_sonyliv.m3u', sonyChannels);
});

// 5. Zee5 Live Endpoint
app.get(['/zee5.m3u', '/zee5.m3u8', '/api/playlist/zee5.m3u', '/api/playlist/zee5.m3u8'], (req, res) => {
  const zeeChannels = channelDatabase.filter(
    (c) => c.status !== 'trashed' && (c.sourceId.includes('zee5') || c.title.toLowerCase().includes('zee'))
  );
  serveM3UResponse(res, 'nexus_zee5.m3u', zeeChannels);
});

// 6. CloudStream M3U Endpoint
app.get(['/cloudstream.m3u', '/cloudstream.m3u8', '/api/cloudstream.m3u'], (req, res) => {
  const csChannels: ChannelStream[] = cloudstreamItems.map((item, idx) => ({
    id: `cs-${idx}`,
    title: item.name,
    url: item.url,
    logo: item.logo,
    group: item.category || 'CloudStream Extensions',
    tvgId: item.internalName || item.id,
    sourceId: 'src-cloudstream',
    sourceName: 'CloudStream Extensions',
  }));
  serveM3UResponse(res, 'nexus_cloudstream.m3u', csChannels);
});

// 7. SkyStream M3U Endpoint
app.get(['/skystream.m3u', '/skystream.m3u8', '/api/skystream.m3u'], (req, res) => {
  const skyChannels: ChannelStream[] = skystreamItems.map((item, idx) => ({
    id: `sky-${idx}`,
    title: item.name,
    url: item.url,
    logo: item.logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547',
    group: item.category || 'SkyStream Universe',
    sourceId: 'src-skystream',
    sourceName: 'SkyStream Universe',
  }));
  serveM3UResponse(res, 'nexus_skystream.m3u', skyChannels);
});

// 8. Rebuild Custom Playlist Endpoint (Global & by category slug)
app.get(['/rebuild.m3u', '/rebuild.m3u8', '/api/playlist/rebuild.m3u', '/api/playlist/rebuild.m3u8'], (req, res) => {
  const channelsMap = new Map<string, ChannelStream>(channelDatabase.map((c) => [c.id, c]));
  const rebuildChannels: ChannelStream[] = [];

  for (const cat of rebuildCategories) {
    for (const chId of cat.channelIds) {
      const orig = channelsMap.get(chId);
      if (orig && orig.status !== 'trashed') {
        rebuildChannels.push({
          ...orig,
          group: cat.name,
        });
      }
    }
  }

  serveM3UResponse(res, 'nexus_rebuild.m3u', rebuildChannels);
});

app.get(['/rebuild/:slug.m3u', '/rebuild/:slug.m3u8', '/api/rebuilt/:slug.m3u', '/api/rebuilt/:slug.m3u8'], (req, res) => {
  const { slug } = req.params;
  const cat = rebuildCategories.find((c) => c.slug === slug || c.id === slug);
  if (!cat) return res.status(404).send('#EXTM3U\n# Error: Rebuild category not found\n');

  const channelsMap = new Map<string, ChannelStream>(channelDatabase.map((c) => [c.id, c]));
  const catChannels: ChannelStream[] = [];

  for (const chId of cat.channelIds) {
    const orig = channelsMap.get(chId);
    if (orig && orig.status !== 'trashed') {
      catChannels.push({
        ...orig,
        group: cat.name,
      });
    }
  }

  serveM3UResponse(res, `nexus_${slug}.m3u`, catChannels);
});

// 9. Dedicated URL for EVERY Source by slug! (e.g. /plugx.m3u, /stalkmax.m3u, /playlist/plugx.m3u)
app.get(['/:slug.m3u', '/:slug.m3u8', '/playlist/:slug.m3u', '/playlist/:slug.m3u8', '/api/playlist/:slug.m3u', '/api/playlist/:slug.m3u8'], (req, res, next) => {
  const { slug } = req.params;
  if (['all', 'combined', 'nexus', 'fancode', 'sony', 'zee5', 'cloudstream', 'skystream', 'rebuild'].includes(slug)) {
    return next();
  }

  const source = playlistSources.find((s) => s.slug === slug || s.id === slug);
  if (source) {
    const list = channelDatabase.filter((c) => c.sourceId === source.id && c.status !== 'trashed');
    return serveM3UResponse(res, `${source.slug}.m3u`, list);
  }

  // Check if slug matches a Category
  const categoryMatch = channelDatabase.filter((c) => {
    const g = (c.customGroup || c.group || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    return g === slug && c.status !== 'trashed';
  });

  if (categoryMatch.length > 0) {
    return serveM3UResponse(res, `category_${slug}.m3u`, categoryMatch);
  }

  return next();
});

// 10. Dedicated URL for ANY Group Category! (e.g. /playlist/group/:groupName.m3u)
app.get(['/playlist/group/:groupName.m3u', '/playlist/group/:groupName.m3u8'], (req, res) => {
  const { groupName } = req.params;
  const decodedGroup = decodeURIComponent(groupName);

  const channels = channelDatabase.filter(
    (c) => c.status !== 'trashed' && (c.customGroup || c.group) === decodedGroup
  );

  serveM3UResponse(res, `${decodedGroup.replace(/[^a-zA-Z0-9_-]/g, '_')}.m3u`, channels);
});

// 11. Dynamic Export M3U (custom multi-filter)
app.get('/api/playlist/export', (req, res) => {
  const { sources, groups, name } = req.query;
  let list = channelDatabase.filter((c) => c.status !== 'trashed');

  if (sources) {
    const srcList = String(sources).split(',');
    list = list.filter((c) => srcList.includes(c.sourceId) || (c.sourceName && srcList.includes(c.sourceName)));
  }

  if (groups) {
    const grpList = String(groups).split(',');
    list = list.filter((c) => c.group && grpList.includes(c.group));
  }

  const filename = (name ? String(name).replace(/[^a-zA-Z0-9_-]/g, '_') : 'nexus_export') + '.m3u';
  serveM3UResponse(res, filename, list);
});

// 12. CORS Proxy Route for Stream / Playlist Testing
app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) return res.status(400).send('URL query parameter is required');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const upstream = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': appSettings.userAgent,
        'Accept': '*/*',
      },
    });

    clearTimeout(timeout);

    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (upstream.body) {
      // @ts-ignore
      const reader = upstream.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      };
      await pump();
    } else {
      const text = await upstream.text();
      res.send(text);
    }
  } catch (err: any) {
    res.status(502).json({ error: 'Proxy request failed', details: err.message });
  }
});

// Mount Vite or Static Frontend
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Nexus Empire Server] Running on http://0.0.0.0:${PORT} (Domain: ${appSettings.domain})`);
  });
}

startServer().catch((err) => {
  console.error('[Nexus Empire Server] Failed to start:', err);
});

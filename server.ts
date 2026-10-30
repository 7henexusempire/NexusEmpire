import express, { Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { playlistService } from './src/server/playlistService';
import { rebuildService } from './src/server/rebuildService';
import { cloudstreamService } from './src/server/cloudstreamService';
import { skystreamService } from './src/server/skystreamService';
import { stremioNuvioService } from './src/server/stremioNuvioService';
import { eventsService } from './src/server/eventsService';
import { primeService } from './src/server/primeService';
import { nexusEventsService } from './src/server/nexusEventsService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Middlewares
app.use(cors({ origin: '*' }));
app.use(compression());
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Favicon redirect for web browsers and IPTV players
app.get('/favicon.ico', (req, res) => {
  return res.redirect('https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547');
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Nexus Empire',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Helper to serve M3U with proper headers
function serveM3U(req: Request, res: Response, sourceIdOrSlug?: string) {
  const group = req.query.group as string | undefined;
  const m3uContent = playlistService.generateM3U(sourceIdOrSlug, group);
  const cleanContent = m3uContent.replace(/:8443/g, '').replace(/:3000/g, '');

  const cleanName = sourceIdOrSlug && sourceIdOrSlug !== 'all' ? sourceIdOrSlug : 'cartel187_all';

  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${cleanName}.m3u"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');

  return res.send(cleanContent);
}

function serveEventM3U(service: 'fancode' | 'sonyliv' | 'zee5' | 'all', res: Response) {
  const m3u = eventsService.generateM3U(service);
  const cleanContent = m3u.replace(/:8443/g, '').replace(/:3000/g, '');

  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${service}.m3u"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');

  return res.send(cleanContent);
}

function serveEventJSON(service: 'fancode' | 'sonyliv' | 'zee5' | 'all', res: Response) {
  const data = service === 'all' ? eventsService.getAllEvents() : eventsService.getEvents(service);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json(data);
}

// Helper to serve JSON representation
function serveJSON(req: Request, res: Response, sourceIdOrSlug?: string) {
  const group = req.query.group as string | undefined;
  const jsonContent = playlistService.generateJSON(sourceIdOrSlug, group);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');

  return res.json(jsonContent);
}

// ============================================================
// 1. COMBINED & ROOT PLAYLIST ENDPOINTS
// ============================================================
app.get('/playlist.m3u', (req, res) => serveM3U(req, res, 'all'));
app.get('/playlist.m3u8', (req, res) => serveM3U(req, res, 'all'));
app.get('/all.m3u', (req, res) => serveM3U(req, res, 'all'));
app.get('/all.m3u8', (req, res) => serveM3U(req, res, 'all'));

app.get('/api/playlist/all.m3u', (req, res) => serveM3U(req, res, 'all'));
app.get('/api/playlist/all.m3u8', (req, res) => serveM3U(req, res, 'all'));
app.get('/playlist/all.m3u', (req, res) => serveM3U(req, res, 'all'));
app.get('/playlist/all.m3u8', (req, res) => serveM3U(req, res, 'all'));

app.get('/api/playlist.json', (req, res) => serveJSON(req, res, 'all'));
app.get('/playlist.json', (req, res) => serveJSON(req, res, 'all'));
app.get('/api/playlist/all.json', (req, res) => serveJSON(req, res, 'all'));
app.get('/playlist/all.json', (req, res) => serveJSON(req, res, 'all'));

// ============================================================
// 2. NEXUSEMPIRE & ANINEXUS STREAMBOX ENDPOINTS
// ============================================================
function serveNexusEmpireM3U(req: Request, res: Response, slug: string) {
  const content = playlistService.generateNexusEmpireM3U(slug);
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="nexusempire_${slug}.m3u"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');
  return res.send(content);
}

function serveNexusEmpireJSON(req: Request, res: Response, slug: string) {
  const data = playlistService.generateNexusEmpireJSON(slug);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json(data);
}

// NexusEmpire Primary Routes
app.get('/api/nexusempire', (req: Request, res: Response) => {
  return res.json(playlistService.getNexusEmpireItems());
});

app.get('/nexusempire/all.m3u', (req, res) => serveNexusEmpireM3U(req, res, 'all'));
app.get('/nexusempire/all.m3u8', (req, res) => serveNexusEmpireM3U(req, res, 'all'));
app.get('/api/nexusempire/all.m3u', (req, res) => serveNexusEmpireM3U(req, res, 'all'));
app.get('/api/nexusempire/all.m3u8', (req, res) => serveNexusEmpireM3U(req, res, 'all'));
app.get('/api/nexusempire/all.json', (req, res) => serveNexusEmpireJSON(req, res, 'all'));
app.get('/nexusempire/all.json', (req, res) => serveNexusEmpireJSON(req, res, 'all'));

app.get('/nexusempire/:slug.m3u', (req, res) => serveNexusEmpireM3U(req, res, req.params.slug));
app.get('/nexusempire/:slug.m3u8', (req, res) => serveNexusEmpireM3U(req, res, req.params.slug));
app.get('/api/nexusempire/:slug.m3u', (req, res) => serveNexusEmpireM3U(req, res, req.params.slug));
app.get('/api/nexusempire/:slug.m3u8', (req, res) => serveNexusEmpireM3U(req, res, req.params.slug));
app.get('/api/nexusempire/:slug.json', (req, res) => serveNexusEmpireJSON(req, res, req.params.slug));

// Backward Compatibility for AniNexus clients
app.get('/api/aninexus', (req: Request, res: Response) => {
  return res.json(playlistService.getNexusEmpireItems());
});
app.get('/api/aninexus/all.m3u', (req, res) => serveNexusEmpireM3U(req, res, 'all'));
app.get('/api/aninexus/all.m3u8', (req, res) => serveNexusEmpireM3U(req, res, 'all'));
app.get('/api/aninexus/all.json', (req, res) => serveNexusEmpireJSON(req, res, 'all'));
app.get('/api/aninexus/:slug.m3u', (req, res) => serveNexusEmpireM3U(req, res, req.params.slug));
app.get('/api/aninexus/:slug.m3u8', (req, res) => serveNexusEmpireM3U(req, res, req.params.slug));
app.get('/api/aninexus/:slug.json', (req, res) => serveNexusEmpireJSON(req, res, req.params.slug));

// NexusEmpire Category Management APIs
app.get('/api/nexusempire/categories', (req: Request, res: Response) => {
  return res.json(playlistService.getNexusEmpireCategories());
});

app.post('/api/nexusempire/categories', (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    const ok = playlistService.createNexusEmpireCategory(name);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/nexusempire/categories/rename', (req: Request, res: Response) => {
  try {
    const { oldName, newName } = req.body;
    if (!oldName || !newName) return res.status(400).json({ error: 'oldName and newName are required' });
    const ok = playlistService.renameNexusEmpireCategory(oldName, newName);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// NexusEmpire Items / Streams Management APIs
app.post('/api/nexusempire/items', (req: Request, res: Response) => {
  try {
    const { name, uri, slug, category, logo, description } = req.body;
    if (!name || !uri) return res.status(400).json({ error: 'Name and stream URI are required' });
    const created = playlistService.addNexusEmpireItem({ name, uri, slug, category, logo, description });
    return res.json({ success: true, item: created });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/nexusempire/items/:id', (req: Request, res: Response) => {
  try {
    const updated = playlistService.updateNexusEmpireItem(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Stream item not found' });
    return res.json({ success: true, item: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/nexusempire/items/:id', (req: Request, res: Response) => {
  try {
    const ok = playlistService.deleteNexusEmpireItem(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/nexusempire/items/:id/toggle', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    const updated = playlistService.updateNexusEmpireItem(req.params.id, { enabled });
    if (!updated) return res.status(404).json({ error: 'Stream item not found' });
    return res.json({ success: true, item: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/nexusempire/move', (req: Request, res: Response) => {
  try {
    const { itemIds, category } = req.body;
    if (!Array.isArray(itemIds) || !category) {
      return res.status(400).json({ error: 'itemIds array and target category are required' });
    }
    const moved = playlistService.moveNexusEmpireItemsToCategory(itemIds, category);
    return res.json({ success: true, movedCount: moved });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/nexusempire/move-channels', (req: Request, res: Response) => {
  try {
    const { channelIds, category } = req.body;
    if (!Array.isArray(channelIds) || !category) {
      return res.status(400).json({ error: 'channelIds and target category are required' });
    }
    const moved = playlistService.moveChannelsToCategory(channelIds, category);
    return res.json({ success: true, movedCount: moved });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/nexusempire/categories/:name', (req: Request, res: Response) => {
  try {
    const ok = playlistService.deleteNexusEmpireCategory(req.params.name);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/nexusempire/ai-categorize', async (req: Request, res: Response) => {
  try {
    const result = await playlistService.aiCategorizeChannels(req.body?.sourceId || 'all');
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/channels/bulk-prefix-suffix', (req: Request, res: Response) => {
  try {
    const { sourceId, config } = req.body;
    if (!config) {
      return res.status(400).json({ error: 'config object is required' });
    }
    const result = playlistService.applyBulkPrefixSuffix(sourceId || 'all', config);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/nexusempire/items/:id/channels', (req: Request, res: Response) => {
  try {
    const result = playlistService.getChannelsForNexusEmpireCategory(req.params.id, true);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 2B. NEXUS REBUILD STUDIO ENDPOINTS
// ============================================================
app.get('/api/rebuilt', (req: Request, res: Response) => {
  return res.json(rebuildService.getAll());
});

app.post('/api/rebuilt', (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      slug,
      targetType,
      targetSourceOrCategory,
      customCategories,
      namePrefix,
      nameSuffix,
      groupPrefix,
      groupSuffix,
      startChannelNumber,
      enableChannelNumbering,
    } = req.body;
    if (!name || !targetType) {
      return res.status(400).json({ error: 'Name and targetType are required' });
    }
    const created = rebuildService.create({
      name,
      description,
      slug,
      targetType,
      targetSourceOrCategory: targetSourceOrCategory || 'all',
      customCategories: customCategories || { 'Main Bouquet': [] },
      namePrefix,
      nameSuffix,
      groupPrefix,
      groupSuffix,
      startChannelNumber,
      enableChannelNumbering,
    });
    return res.json({ success: true, playlist: created });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/rebuilt/:id', (req: Request, res: Response) => {
  try {
    const updated = rebuildService.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Rebuilt playlist not found' });
    return res.json({ success: true, playlist: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rebuilt/:id', (req: Request, res: Response) => {
  try {
    const ok = rebuildService.delete(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

function serveRebuiltM3U(req: Request, res: Response, slug: string) {
  const allChannels = playlistService.getAllChannels('all');
  const m3u = rebuildService.generateM3U(slug, allChannels);
  const cleanContent = m3u.replace(/:8443/g, '').replace(/:3000/g, '');
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${slug}.m3u"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  return res.send(cleanContent);
}

function serveRebuiltJSON(req: Request, res: Response, slug: string) {
  const p = rebuildService.getById(slug);
  if (!p) return res.status(404).json({ error: 'Rebuilt playlist not found' });
  const allChannels = playlistService.getAllChannels('all');
  const channelMap = new Map(allChannels.map((c) => [c.id, c]));
  const result: any = { ...p, categories: {} };
  for (const [cat, ids] of Object.entries(p.customCategories)) {
    result.categories[cat] = ids.map((id) => channelMap.get(id)).filter(Boolean);
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json(result);
}

function servePrimeM3U(req: Request, res: Response, slug: string) {
  const m3u = primeService.generateM3U(slug);
  const cleanContent = m3u.replace(/:8443/g, '').replace(/:3000/g, '');
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${slug}.m3u"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  return res.send(cleanContent);
}

function servePrimeJSON(req: Request, res: Response, slug: string) {
  const data = primeService.generateJSON(slug);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json(data);
}

function serveNexusEventsM3U(req: Request, res: Response, slug?: string) {
  const m3u = nexusEventsService.generateM3U(slug);
  const cleanContent = m3u.replace(/:8443/g, '').replace(/:3000/g, '');
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${slug || 'events'}.m3u"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  return res.send(cleanContent);
}

function serveNexusEventsJSON(req: Request, res: Response, slug?: string) {
  const data = nexusEventsService.generateJSON(slug);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json(data);
}

// Rebuild Endpoints (M3U & JSON)
app.get('/rebuild/:slug.m3u', (req, res) => serveRebuiltM3U(req, res, req.params.slug));
app.get('/rebuild/:slug.m3u8', (req, res) => serveRebuiltM3U(req, res, req.params.slug));
app.get('/rebuild/:slug.json', (req, res) => serveRebuiltJSON(req, res, req.params.slug));
app.get('/api/rebuild/:slug.m3u', (req, res) => serveRebuiltM3U(req, res, req.params.slug));
app.get('/api/rebuild/:slug.m3u8', (req, res) => serveRebuiltM3U(req, res, req.params.slug));
app.get('/api/rebuild/:slug.json', (req, res) => serveRebuiltJSON(req, res, req.params.slug));
app.get('/api/rebuilt/:slug.m3u', (req, res) => serveRebuiltM3U(req, res, req.params.slug));
app.get('/api/rebuilt/:slug.m3u8', (req, res) => serveRebuiltM3U(req, res, req.params.slug));
app.get('/api/rebuilt/:slug.json', (req, res) => serveRebuiltJSON(req, res, req.params.slug));

// ============================================================
// 2C. NEXUS PRIME MASTER PLAYLIST ENDPOINTS
// ============================================================
app.get('/api/nexusprime', (req: Request, res: Response) => {
  return res.json(primeService.getAll());
});

app.post('/api/nexusprime', (req: Request, res: Response) => {
  try {
    const created = primeService.create(req.body);
    return res.json({ success: true, playlist: created });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/nexusprime/:id', (req: Request, res: Response) => {
  try {
    const updated = primeService.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Playlist not found' });
    return res.json({ success: true, playlist: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/nexusprime/:id', (req: Request, res: Response) => {
  try {
    const ok = primeService.delete(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/nexusprime/:id/streams', (req: Request, res: Response) => {
  try {
    const added = primeService.addStream(req.params.id, req.body);
    return res.json({ success: true, stream: added });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/nexusprime/:id/streams/bulk', (req: Request, res: Response) => {
  try {
    const count = primeService.addMultipleStreams(req.params.id, req.body.streams || []);
    return res.json({ success: true, addedCount: count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/nexusprime/:id/streams/:streamId', (req: Request, res: Response) => {
  try {
    const ok = primeService.updateStream(req.params.id, req.params.streamId, req.body);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/nexusprime/:id/streams/:streamId', (req: Request, res: Response) => {
  try {
    const ok = primeService.removeStream(req.params.id, req.params.streamId);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/nexusprime/:id/bulk-category-logo', (req: Request, res: Response) => {
  try {
    const { category, logoUrl } = req.body;
    const count = primeService.bulkApplyCategoryLogo(req.params.id, category, logoUrl);
    return res.json({ success: true, updatedCount: count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/nexusprime/:id/bulk-all-logo', (req: Request, res: Response) => {
  try {
    const { logoUrl } = req.body;
    const count = primeService.bulkApplyAllLogo(req.params.id, logoUrl);
    return res.json({ success: true, updatedCount: count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/nexusprime/all.m3u', (req, res) => servePrimeM3U(req, res, 'nexus-prime'));
app.get('/nexusprime/all.m3u8', (req, res) => servePrimeM3U(req, res, 'nexus-prime'));
app.get('/nexusprime/:slug.m3u', (req, res) => servePrimeM3U(req, res, req.params.slug));
app.get('/nexusprime/:slug.m3u8', (req, res) => servePrimeM3U(req, res, req.params.slug));
app.get('/nexusprime/:slug.json', (req, res) => servePrimeJSON(req, res, req.params.slug));
app.get('/api/nexusprime/:slug.m3u', (req, res) => servePrimeM3U(req, res, req.params.slug));
app.get('/api/nexusprime/:slug.m3u8', (req, res) => servePrimeM3U(req, res, req.params.slug));
app.get('/api/nexusprime/:slug.json', (req, res) => servePrimeJSON(req, res, req.params.slug));

// ============================================================
// 2D. NEXUS EVENTS MATCH & TOURNAMENT AGGREGATOR ENDPOINTS
// ============================================================
app.get('/api/nexus-events', (req: Request, res: Response) => {
  return res.json(nexusEventsService.getAll());
});

app.post('/api/nexus-events', (req: Request, res: Response) => {
  try {
    const created = nexusEventsService.create(req.body);
    return res.json({ success: true, match: created });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/nexus-events/:id', (req: Request, res: Response) => {
  try {
    const updated = nexusEventsService.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    return res.json({ success: true, match: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/nexus-events/:id', (req: Request, res: Response) => {
  try {
    const ok = nexusEventsService.delete(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/nexus-events/:id/streams', (req: Request, res: Response) => {
  try {
    const added = nexusEventsService.addStreamToMatch(req.params.id, req.body);
    return res.json({ success: true, stream: added });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/nexus-events/:id/streams/:streamId', (req: Request, res: Response) => {
  try {
    const ok = nexusEventsService.removeStreamFromMatch(req.params.id, req.params.streamId);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/nexus-events/:id/bulk-logo', (req: Request, res: Response) => {
  try {
    const { logoUrl } = req.body;
    const count = nexusEventsService.bulkApplyLogoToMatchStreams(req.params.id, logoUrl);
    return res.json({ success: true, updatedCount: count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/events/all.m3u', (req, res) => serveNexusEventsM3U(req, res, 'all'));
app.get('/events/all.m3u8', (req, res) => serveNexusEventsM3U(req, res, 'all'));
app.get('/events/all.json', (req, res) => serveNexusEventsJSON(req, res, 'all'));
app.get('/events/:slug.m3u', (req, res) => serveNexusEventsM3U(req, res, req.params.slug));
app.get('/events/:slug.m3u8', (req, res) => serveNexusEventsM3U(req, res, req.params.slug));
app.get('/events/:slug.json', (req, res) => serveNexusEventsJSON(req, res, req.params.slug));
app.get('/api/nexus-events/:slug.m3u', (req, res) => serveNexusEventsM3U(req, res, req.params.slug));
app.get('/api/nexus-events/:slug.m3u8', (req, res) => serveNexusEventsM3U(req, res, req.params.slug));
app.get('/api/nexus-events/:slug.json', (req, res) => serveNexusEventsJSON(req, res, req.params.slug));

// ============================================================
// 3. INDIVIDUAL PLAYLIST ENDPOINTS (by custom slug or ID, e.g. /api/playlist/nexus-vip.m3u)
// ============================================================
app.get('/api/playlist/:slug.m3u', (req, res) => {
  const { slug } = req.params;
  if (slug === 'all') return serveM3U(req, res, 'all');
  if (slug === 'fancode' || slug === 'fancode-m3u') return serveEventM3U('fancode', res);
  if (slug === 'sonyliv' || slug === 'sony' || slug === 'sony-m3u') return serveEventM3U('sonyliv', res);
  if (slug === 'zee5' || slug === 'zee5-m3u') return serveEventM3U('zee5', res);
  if (rebuildService.getById(slug)) return serveRebuiltM3U(req, res, slug);
  if (primeService.getById(slug)) return servePrimeM3U(req, res, slug);
  if (nexusEventsService.getById(slug)) return serveNexusEventsM3U(req, res, slug);
  const empireItem = playlistService.getNexusEmpireItems().find((i) => i.id === slug || i.slug === slug || i.m3uSlug === slug);
  if (empireItem) return serveNexusEmpireM3U(req, res, slug);
  return serveM3U(req, res, slug);
});

app.get('/api/playlist/:slug.m3u8', (req, res) => {
  const { slug } = req.params;
  if (slug === 'all') return serveM3U(req, res, 'all');
  if (slug === 'fancode' || slug === 'fancode-m3u') return serveEventM3U('fancode', res);
  if (slug === 'sonyliv' || slug === 'sony' || slug === 'sony-m3u') return serveEventM3U('sonyliv', res);
  if (slug === 'zee5' || slug === 'zee5-m3u') return serveEventM3U('zee5', res);
  if (rebuildService.getById(slug)) return serveRebuiltM3U(req, res, slug);
  if (primeService.getById(slug)) return servePrimeM3U(req, res, slug);
  if (nexusEventsService.getById(slug)) return serveNexusEventsM3U(req, res, slug);
  const empireItem = playlistService.getNexusEmpireItems().find((i) => i.id === slug || i.slug === slug || i.m3uSlug === slug);
  if (empireItem) return serveNexusEmpireM3U(req, res, slug);
  return serveM3U(req, res, slug);
});

app.get('/playlist/:slug.m3u', (req, res) => {
  const { slug } = req.params;
  if (slug === 'all') return serveM3U(req, res, 'all');
  if (slug === 'fancode' || slug === 'fancode-m3u') return serveEventM3U('fancode', res);
  if (slug === 'sonyliv' || slug === 'sony' || slug === 'sony-m3u') return serveEventM3U('sonyliv', res);
  if (slug === 'zee5' || slug === 'zee5-m3u') return serveEventM3U('zee5', res);
  if (rebuildService.getById(slug)) return serveRebuiltM3U(req, res, slug);
  if (primeService.getById(slug)) return servePrimeM3U(req, res, slug);
  if (nexusEventsService.getById(slug)) return serveNexusEventsM3U(req, res, slug);
  const empireItem = playlistService.getNexusEmpireItems().find((i) => i.id === slug || i.slug === slug || i.m3uSlug === slug);
  if (empireItem) return serveNexusEmpireM3U(req, res, slug);
  return serveM3U(req, res, slug);
});

app.get('/playlist/:slug.m3u8', (req, res) => {
  const { slug } = req.params;
  if (slug === 'all') return serveM3U(req, res, 'all');
  if (slug === 'fancode' || slug === 'fancode-m3u') return serveEventM3U('fancode', res);
  if (slug === 'sonyliv' || slug === 'sony' || slug === 'sony-m3u') return serveEventM3U('sonyliv', res);
  if (slug === 'zee5' || slug === 'zee5-m3u') return serveEventM3U('zee5', res);
  if (rebuildService.getById(slug)) return serveRebuiltM3U(req, res, slug);
  if (primeService.getById(slug)) return servePrimeM3U(req, res, slug);
  if (nexusEventsService.getById(slug)) return serveNexusEventsM3U(req, res, slug);
  const empireItem = playlistService.getNexusEmpireItems().find((i) => i.id === slug || i.slug === slug || i.m3uSlug === slug);
  if (empireItem) return serveNexusEmpireM3U(req, res, slug);
  return serveM3U(req, res, slug);
});

app.get('/api/playlist/:slug.json', (req, res) => {
  const { slug } = req.params;
  if (slug === 'all') return serveJSON(req, res, 'all');
  if (slug === 'fancode' || slug === 'fancode-m3u') return serveEventJSON('fancode', res);
  if (slug === 'sonyliv' || slug === 'sony' || slug === 'sony-m3u') return serveEventJSON('sonyliv', res);
  if (slug === 'zee5' || slug === 'zee5-m3u') return serveEventJSON('zee5', res);
  if (rebuildService.getById(slug)) return serveRebuiltJSON(req, res, slug);
  if (primeService.getById(slug)) return servePrimeJSON(req, res, slug);
  if (nexusEventsService.getById(slug)) return serveNexusEventsJSON(req, res, slug);
  const empireItem = playlistService.getNexusEmpireItems().find((i) => i.id === slug || i.slug === slug || i.m3uSlug === slug);
  if (empireItem) return serveNexusEmpireJSON(req, res, slug);
  return serveJSON(req, res, slug);
});

app.get('/playlist/:slug.json', (req, res) => {
  const { slug } = req.params;
  if (slug === 'all') return serveJSON(req, res, 'all');
  if (slug === 'fancode' || slug === 'fancode-m3u') return serveEventJSON('fancode', res);
  if (slug === 'sonyliv' || slug === 'sony' || slug === 'sony-m3u') return serveEventJSON('sonyliv', res);
  if (slug === 'zee5' || slug === 'zee5-m3u') return serveEventJSON('zee5', res);
  if (rebuildService.getById(slug)) return serveRebuiltJSON(req, res, slug);
  if (primeService.getById(slug)) return servePrimeJSON(req, res, slug);
  if (nexusEventsService.getById(slug)) return serveNexusEventsJSON(req, res, slug);
  const empireItem = playlistService.getNexusEmpireItems().find((i) => i.id === slug || i.slug === slug || i.m3uSlug === slug);
  if (empireItem) return serveNexusEmpireJSON(req, res, slug);
  return serveJSON(req, res, slug);
});

// Explicit event root shortcuts
app.get('/fancode.m3u', (req, res) => serveEventM3U('fancode', res));
app.get('/fancode.m3u8', (req, res) => serveEventM3U('fancode', res));
app.get('/fancode.json', (req, res) => serveEventJSON('fancode', res));

app.get('/sonyliv.m3u', (req, res) => serveEventM3U('sonyliv', res));
app.get('/sonyliv.m3u8', (req, res) => serveEventM3U('sonyliv', res));
app.get('/sonyliv.json', (req, res) => serveEventJSON('sonyliv', res));

app.get('/sony.m3u', (req, res) => serveEventM3U('sonyliv', res));
app.get('/sony.m3u8', (req, res) => serveEventM3U('sonyliv', res));
app.get('/sony.json', (req, res) => serveEventJSON('sonyliv', res));

app.get('/zee5.m3u', (req, res) => serveEventM3U('zee5', res));
app.get('/zee5.m3u8', (req, res) => serveEventM3U('zee5', res));
app.get('/zee5.json', (req, res) => serveEventJSON('zee5', res));

// Direct root playlist alias
app.get('/:slug.m3u', (req, res, next) => {
  const { slug } = req.params;
  if (slug === 'fancode' || slug === 'fancode-m3u') return serveEventM3U('fancode', res);
  if (slug === 'sonyliv' || slug === 'sony' || slug === 'sony-m3u') return serveEventM3U('sonyliv', res);
  if (slug === 'zee5' || slug === 'zee5-m3u') return serveEventM3U('zee5', res);
  if (slug === 'cloudstream') return serveCloudStreamM3U(req, res);
  if (slug === 'skystream') return serveSkyStreamM3U(req, res);
  if (slug === 'stremio' || slug === 'nuvio-stremio') return serveStremioM3U(req, res);
  if (slug === 'cncverse') return serveCNCVerseM3U(req, res);
  if (['api', 'health', 'assets', 'favicon', 'events', 'rebuild', 'nexusprime'].includes(slug)) return next();
  if (rebuildService.getById(slug)) return serveRebuiltM3U(req, res, slug);
  if (primeService.getById(slug)) return servePrimeM3U(req, res, slug);
  if (nexusEventsService.getById(slug)) return serveNexusEventsM3U(req, res, slug);
  const empireItem = playlistService.getNexusEmpireItems().find((i) => i.id === slug || i.slug === slug || i.m3uSlug === slug);
  if (empireItem) return serveNexusEmpireM3U(req, res, slug);
  return serveM3U(req, res, slug);
});

app.get('/:slug.m3u8', (req, res, next) => {
  const { slug } = req.params;
  if (slug === 'fancode' || slug === 'fancode-m3u') return serveEventM3U('fancode', res);
  if (slug === 'sonyliv' || slug === 'sony' || slug === 'sony-m3u') return serveEventM3U('sonyliv', res);
  if (slug === 'zee5' || slug === 'zee5-m3u') return serveEventM3U('zee5', res);
  if (slug === 'cloudstream') return serveCloudStreamM3U(req, res);
  if (slug === 'skystream') return serveSkyStreamM3U(req, res);
  if (slug === 'stremio' || slug === 'nuvio-stremio') return serveStremioM3U(req, res);
  if (slug === 'cncverse') return serveCNCVerseM3U(req, res);
  if (['api', 'health', 'assets', 'favicon', 'events', 'rebuild', 'nexusprime'].includes(slug)) return next();
  if (rebuildService.getById(slug)) return serveRebuiltM3U(req, res, slug);
  if (primeService.getById(slug)) return servePrimeM3U(req, res, slug);
  if (nexusEventsService.getById(slug)) return serveNexusEventsM3U(req, res, slug);
  const empireItem = playlistService.getNexusEmpireItems().find((i) => i.id === slug || i.slug === slug || i.m3uSlug === slug);
  if (empireItem) return serveNexusEmpireM3U(req, res, slug);
  return serveM3U(req, res, slug);
});

app.get('/:slug.json', (req, res, next) => {
  const { slug } = req.params;
  if (slug === 'fancode' || slug === 'fancode-m3u') return serveEventJSON('fancode', res);
  if (slug === 'sonyliv' || slug === 'sony' || slug === 'sony-m3u') return serveEventJSON('sonyliv', res);
  if (slug === 'zee5' || slug === 'zee5-m3u') return serveEventJSON('zee5', res);
  if (slug === 'cloudstream') return serveCloudStreamJSON(req, res);
  if (['api', 'health', 'assets', 'favicon', 'events', 'rebuild', 'nexusprime'].includes(slug)) return next();
  if (rebuildService.getById(slug)) return serveRebuiltJSON(req, res, slug);
  if (primeService.getById(slug)) return servePrimeJSON(req, res, slug);
  if (nexusEventsService.getById(slug)) return serveNexusEventsJSON(req, res, slug);
  const empireItem = playlistService.getNexusEmpireItems().find((i) => i.id === slug || i.slug === slug || i.m3uSlug === slug);
  if (empireItem) return serveNexusEmpireJSON(req, res, slug);
  return serveJSON(req, res, slug);
});

// ============================================================
// 4. STATUS & SYNC CONTROLS
// ============================================================
app.get('/api/status', (req: Request, res: Response) => {
  const status = playlistService.getGlobalStatus();
  return res.json(status);
});

// ============================================================
// 4B. DUPLICATE REMOVAL & RECOVERY CONTROLS
// ============================================================
app.get('/api/duplicates', (req: Request, res: Response) => {
  try {
    const sourceId = (req.query.sourceId as string) || 'all';
    const report = playlistService.getDuplicateReport(sourceId);
    return res.json(report);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/duplicates/restore', (req: Request, res: Response) => {
  try {
    const { channelIds } = req.body;
    if (!Array.isArray(channelIds) || channelIds.length === 0) {
      return res.status(400).json({ error: 'channelIds array is required' });
    }
    const count = playlistService.restoreChannels(channelIds);
    return res.json({ success: true, restoredCount: count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/duplicates/unrestore', (req: Request, res: Response) => {
  try {
    const { channelIds } = req.body;
    if (!Array.isArray(channelIds) || channelIds.length === 0) {
      return res.status(400).json({ error: 'channelIds array is required' });
    }
    const count = playlistService.unrestoreChannels(channelIds);
    return res.json({ success: true, unrestoredCount: count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/duplicates/ai-clean', async (req: Request, res: Response) => {
  try {
    const sourceId = req.body?.sourceId || 'all';
    const report = playlistService.getDuplicateReport(sourceId);
    return res.json({
      success: true,
      message: 'AI Fuzzy Duplicate Scan Complete',
      fuzzyCount: report.fuzzyCandidates.length,
      exactDuplicatesRemoved: report.stats.exactDuplicatesRemoved,
      fuzzyCandidates: report.fuzzyCandidates,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/sync', async (req: Request, res: Response) => {
  try {
    const sourceId = (req.query.sourceId as string) || req.body?.sourceId;
    if (sourceId && sourceId !== 'all') {
      const result = await playlistService.fetchSingleSource(sourceId);
      return res.json(result);
    } else {
      const result = await playlistService.fetchAllSources();
      return res.json(result);
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 5. PLAYLIST SOURCES & FILE UPLOAD
// ============================================================
app.get('/api/sources', (req: Request, res: Response) => {
  return res.json(playlistService.getSources());
});

app.post('/api/sources', (req: Request, res: Response) => {
  try {
    const { name, url, id, slug } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }
    const created = playlistService.addSource({ name, url, id, slug });
    return res.json({ success: true, source: created });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Upload and host local .m3u / .m3u8 file
app.post('/api/upload-playlist', (req: Request, res: Response) => {
  try {
    const { filename, content, displayName, slug } = req.body;
    if (!filename || !content) {
      return res.status(400).json({ error: 'Filename and playlist content are required' });
    }
    const created = playlistService.uploadM3UFile(filename, content, displayName || filename, slug);
    const m3uUrl = `/api/playlist/${created.slug}.m3u`;
    return res.json({
      success: true,
      message: `Uploaded and hosted "${created.name}"`,
      source: created,
      m3uUrl,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/sources/:id', (req: Request, res: Response) => {
  try {
    const updated = playlistService.updateSource(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Source not found' });
    }
    return res.json({ success: true, source: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Toggle source on/off
app.post('/api/sources/:id/toggle', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    const updated = playlistService.updateSource(req.params.id, { enabled });
    if (!updated) {
      return res.status(404).json({ error: 'Source not found' });
    }
    return res.json({ success: true, source: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sources/:id', (req: Request, res: Response) => {
  try {
    const ok = playlistService.deleteSource(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 6. CHANNEL MANAGEMENT APIS
// ============================================================
app.get('/api/channels', (req: Request, res: Response) => {
  try {
    const sourceId = (req.query.sourceId as string) || 'all';
    const search = ((req.query.search as string) || '').trim().toLowerCase();
    const group = (req.query.group as string) || '';
    const status = (req.query.status as string) || 'all';
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;

    let all = playlistService.getAllChannels(sourceId);

    if (search) {
      all = all.filter((c) => {
        const name = (c.customName || c.name || '').toLowerCase();
        const orig = (c.name || '').toLowerCase();
        const grp = (c.customGroup || c.groupTitle || '').toLowerCase();
        const id = (c.tvgId || c.id || '').toLowerCase();
        return name.includes(search) || orig.includes(search) || grp.includes(search) || id.includes(search);
      });
    }

    if (group && group !== 'all') {
      all = all.filter((c) => (c.customGroup || c.groupTitle).toLowerCase() === group.toLowerCase());
    }

    if (status === 'active') {
      all = all.filter((c) => c.enabled);
    } else if (status === 'hidden') {
      all = all.filter((c) => !c.enabled);
    } else if (status === 'clearkey') {
      all = all.filter((c) => c.hasClearKey);
    } else if (status === 'custom') {
      all = all.filter((c) => c.isCustom);
    }

    const total = all.length;
    const startIndex = (page - 1) * limit;
    const paginated = all.slice(startIndex, startIndex + limit);

    return res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      channels: paginated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/channels/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ok = playlistService.updateChannel(id, req.body);
    if (!ok) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Bulk toggle enable/disable channels
app.post('/api/channels/bulk-toggle', (req: Request, res: Response) => {
  try {
    const { channelIds, enabled } = req.body;
    if (!Array.isArray(channelIds) || channelIds.length === 0) {
      return res.status(400).json({ error: 'channelIds array is required' });
    }
    const count = playlistService.bulkToggleChannels(channelIds, !!enabled);
    return res.json({ success: true, updatedCount: count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/channels/reset/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ok = playlistService.resetChannel(id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/channels/add', (req: Request, res: Response) => {
  try {
    const { name, group, url, logo, tvgId, tvgChno, directives } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and Stream URL are required' });
    }
    const created = playlistService.addCustomChannel({
      name,
      group: group || 'Custom',
      url,
      logo,
      tvgId,
      tvgChno,
      directives: directives || [],
    });
    return res.json({ success: true, channel: created });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 7. GROUP MANAGEMENT APIS
// ============================================================
app.get('/api/groups', (req: Request, res: Response) => {
  const sourceId = req.query.sourceId as string | undefined;
  return res.json(playlistService.getGroups(sourceId));
});

app.post('/api/groups/rename', (req: Request, res: Response) => {
  try {
    const { oldName, newName } = req.body;
    if (!oldName || !newName) {
      return res.status(400).json({ error: 'Old name and new name are required' });
    }
    playlistService.renameGroup(oldName, newName);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/groups/toggle', (req: Request, res: Response) => {
  try {
    const { groupName, visible } = req.body;
    if (groupName === undefined || visible === undefined) {
      return res.status(400).json({ error: 'groupName and visible are required' });
    }
    playlistService.toggleGroupVisibility(groupName, visible);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/groups/bulk-logo', (req: Request, res: Response) => {
  try {
    const { groupNames, logoUrl } = req.body;
    if (!Array.isArray(groupNames) || groupNames.length === 0) {
      return res.status(400).json({ error: 'groupNames array is required' });
    }
    const count = playlistService.setBulkGroupLogo(groupNames, logoUrl || '');
    return res.json({ success: true, updatedChannels: count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/groups/remove-prefix', (req: Request, res: Response) => {
  try {
    const { prefix } = req.body;
    if (!prefix) return res.status(400).json({ error: 'Prefix is required' });
    const count = playlistService.removeGroupPrefix(prefix);
    return res.json({ success: true, updatedCount: count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 8. SETTINGS & BACKUPS
// ============================================================
app.get('/api/settings', (req: Request, res: Response) => {
  return res.json(playlistService.getSettings());
});

app.put('/api/settings', (req: Request, res: Response) => {
  try {
    const updated = playlistService.updateSettings(req.body);
    return res.json({ success: true, settings: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/backup/export', (req: Request, res: Response) => {
  const backup = playlistService.exportBackup();
  res.setHeader('Content-Disposition', 'attachment; filename="cartel187-backup.json"');
  res.setHeader('Content-Type', 'application/json');
  return res.json(backup);
});

app.post('/api/backup/import', (req: Request, res: Response) => {
  try {
    playlistService.importBackup(req.body);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Invalid backup payload' });
  }
});

app.get('/api/preview-m3u', (req: Request, res: Response) => {
  const sourceId = req.query.sourceId as string | undefined;
  const m3u = playlistService.generateM3U(sourceId);
  const lines = m3u.split('\n');
  const preview = lines.slice(0, 120).join('\n');
  return res.json({
    totalLines: lines.length,
    preview,
  });
});

// ============================================================
// 2C. CLOUDSTREAM REPOS & LIVE EVENTS ENDPOINTS
// ============================================================
app.get('/api/cloudstream/repos', (req: Request, res: Response) => {
  return res.json(cloudstreamService.getRepos());
});

app.post('/api/cloudstream/repos', (req: Request, res: Response) => {
  try {
    const { name, url } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'Name and repository URL are required' });
    const repo = cloudstreamService.addRepo(name, url);
    return res.json({ success: true, repo });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cloudstream/repos/:id/sync', async (req: Request, res: Response) => {
  try {
    const ok = await cloudstreamService.fetchSingleRepo(req.params.id);
    return res.json({ success: ok, repos: cloudstreamService.getRepos() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cloudstream/sync-all', async (req: Request, res: Response) => {
  try {
    const result = await cloudstreamService.fetchAllRepos();
    return res.json({ ...result, repos: cloudstreamService.getRepos() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cloudstream/repos/:id', (req: Request, res: Response) => {
  try {
    const ok = cloudstreamService.deleteRepo(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/cloudstream/items', (req: Request, res: Response) => {
  return res.json(cloudstreamService.getItems());
});

app.post('/api/cloudstream/items', (req: Request, res: Response) => {
  try {
    const { name, url, category, logo, description } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'Name and stream URL are required' });
    const item = cloudstreamService.addItem({ name, url, category, logo, description });
    return res.json({ success: true, item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/cloudstream/items/:id', (req: Request, res: Response) => {
  try {
    const updated = cloudstreamService.updateItem(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    return res.json({ success: true, item: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cloudstream/items/:id', (req: Request, res: Response) => {
  try {
    const ok = cloudstreamService.deleteItem(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cloudstream/items/:id/toggle', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    const updated = cloudstreamService.toggleItem(req.params.id, enabled);
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    return res.json({ success: true, item: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cloudstream/categories/toggle', (req: Request, res: Response) => {
  try {
    const { category, enabled } = req.body;
    if (!category) return res.status(400).json({ error: 'Category is required' });
    const count = cloudstreamService.toggleCategory(category, enabled);
    return res.json({ success: true, count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cloudstream/categories/rename', (req: Request, res: Response) => {
  try {
    const { oldCategory, newCategory } = req.body;
    if (!oldCategory || !newCategory) return res.status(400).json({ error: 'Both old and new category names required' });
    const count = cloudstreamService.renameCategory(oldCategory, newCategory);
    return res.json({ success: true, count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/cloudstream/raw-json', (req: Request, res: Response) => {
  const repoId = req.query.repoId as string | undefined;
  return res.json(cloudstreamService.getRawJson(repoId));
});

function serveCloudStreamM3U(req: Request, res: Response) {
  const m3u = cloudstreamService.generateM3U();
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="nexus_cloudstream.m3u"');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.send(m3u);
}

function serveCloudStreamJSON(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json(cloudstreamService.generateJSON());
}

app.get('/cloudstream.m3u', serveCloudStreamM3U);
app.get('/cloudstream.m3u8', serveCloudStreamM3U);
app.get('/api/cloudstream.m3u', serveCloudStreamM3U);
app.get('/api/cloudstream/playlist.m3u', serveCloudStreamM3U);
app.get('/cloudstream.json', serveCloudStreamJSON);
app.get('/api/cloudstream/json', serveCloudStreamJSON);
app.get('/api/cloudstream/all.json', serveCloudStreamJSON);

// ============================================================
// 2D. SKYSTREAM SHORTCODES & EXTENSIONS ENDPOINTS
// ============================================================
app.get('/api/skystream/extensions', (req: Request, res: Response) => {
  return res.json({
    repos: skystreamService.getRepos(),
    items: skystreamService.getItems(),
  });
});

app.post('/api/skystream/fetch', async (req: Request, res: Response) => {
  try {
    const { url, name } = req.body;
    if (!url) return res.status(400).json({ error: 'Shortcode or Repository URL required' });
    const result = await skystreamService.fetchByShortcodeOrUrl(url);
    return res.json({ ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/skystream/sync-all', async (req: Request, res: Response) => {
  try {
    const result = await skystreamService.fetchAll();
    return res.json({ ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/skystream/items', (req: Request, res: Response) => {
  try {
    const item = skystreamService.addItem(req.body);
    return res.json({ success: true, item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/skystream/items/:id', (req: Request, res: Response) => {
  try {
    const item = skystreamService.updateItem(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    return res.json({ success: true, item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/skystream/items/:id/toggle', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    const item = skystreamService.toggleItem(req.params.id, enabled);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    return res.json({ success: true, item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/skystream/items/:id', (req: Request, res: Response) => {
  try {
    const ok = skystreamService.deleteItem(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/skystream/categories/toggle', (req: Request, res: Response) => {
  try {
    const { category, enabled } = req.body;
    if (!category) return res.status(400).json({ error: 'Category is required' });
    const count = skystreamService.toggleCategory(category, enabled);
    return res.json({ success: true, count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/skystream/categories/rename', (req: Request, res: Response) => {
  try {
    const { oldCategory, newCategory } = req.body;
    if (!oldCategory || !newCategory) return res.status(400).json({ error: 'Both old and new category names required' });
    const count = skystreamService.renameCategory(oldCategory, newCategory);
    return res.json({ success: true, count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/skystream/raw-json', (req: Request, res: Response) => {
  const targetId = (req.query.targetId || req.query.shortcode) as string | undefined;
  return res.json(skystreamService.getRawJson(targetId));
});

function serveSkyStreamM3U(req: Request, res: Response) {
  const m3u = skystreamService.generateM3U();
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="nexus_skystream.m3u"');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.send(m3u);
}

function serveSkyStreamJSON(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json(skystreamService.generateJSON());
}

app.get('/skystream.m3u', serveSkyStreamM3U);
app.get('/skystream.m3u8', serveSkyStreamM3U);
app.get('/api/skystream.m3u', serveSkyStreamM3U);
app.get('/skystream.json', serveSkyStreamJSON);
app.get('/api/skystream.json', serveSkyStreamJSON);

// ============================================================
// 2E. STREMIO / NUVIO & CNCVERSE-BRIDGE ENDPOINTS
// ============================================================
app.get('/api/stremio/addons', (req: Request, res: Response) => {
  return res.json(stremioNuvioService.getAddons());
});

app.post('/api/stremio/addons', async (req: Request, res: Response) => {
  try {
    const { manifestUrl, name } = req.body;
    if (!manifestUrl) return res.status(400).json({ error: 'Manifest URL is required' });
    const addon = await stremioNuvioService.addAddon(manifestUrl, name);
    return res.json({ success: true, addon });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/stremio/addons/:id/sync', async (req: Request, res: Response) => {
  try {
    const ok = await stremioNuvioService.fetchAddonManifest(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/stremio/sync-all', async (req: Request, res: Response) => {
  try {
    const result = await stremioNuvioService.syncAllAddons();
    return res.json({ ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/stremio/raw-json', (req: Request, res: Response) => {
  const addonId = req.query.addonId as string | undefined;
  return res.json(stremioNuvioService.getRawJson(addonId));
});

app.get('/api/cncverse/streams', (req: Request, res: Response) => {
  return res.json({
    bridge: stremioNuvioService.getBridgeStatus(),
    streams: stremioNuvioService.getStreams(),
  });
});

app.get('/api/cncverse/status', async (req: Request, res: Response) => {
  const status = await stremioNuvioService.checkBridgeStatus();
  return res.json({ ...stremioNuvioService.getBridgeStatus(), status });
});

app.post('/api/cncverse/sync', async (req: Request, res: Response) => {
  try {
    await stremioNuvioService.checkBridgeStatus();
    return res.json({ success: true, bridge: stremioNuvioService.getBridgeStatus() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cncverse/url', (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    stremioNuvioService.setBridgeUrl(url);
    return res.json({ success: true, bridge: stremioNuvioService.getBridgeStatus() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cncverse/streams', (req: Request, res: Response) => {
  try {
    const item = stremioNuvioService.addStream(req.body);
    return res.json({ success: true, item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/cncverse/streams/:id', (req: Request, res: Response) => {
  try {
    const item = stremioNuvioService.updateStream(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: 'Stream not found' });
    return res.json({ success: true, item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cncverse/streams/:id/toggle', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    const item = stremioNuvioService.toggleStream(req.params.id, enabled);
    if (!item) return res.status(404).json({ error: 'Stream not found' });
    return res.json({ success: true, item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cncverse/streams/:id', (req: Request, res: Response) => {
  try {
    const ok = stremioNuvioService.deleteStream(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cncverse/categories/toggle', (req: Request, res: Response) => {
  try {
    const { category, enabled } = req.body;
    if (!category) return res.status(400).json({ error: 'Category is required' });
    const count = stremioNuvioService.toggleCategory(category, enabled);
    return res.json({ success: true, count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cncverse/categories/rename', (req: Request, res: Response) => {
  try {
    const { oldCategory, newCategory } = req.body;
    if (!oldCategory || !newCategory) return res.status(400).json({ error: 'Both old and new category names required' });
    const count = stremioNuvioService.renameCategory(oldCategory, newCategory);
    return res.json({ success: true, count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

function serveCNCVerseM3U(req: Request, res: Response) {
  const m3u = stremioNuvioService.generateCNCVerseM3U();
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="nexus_cncverse.m3u"');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.send(m3u);
}

function serveCNCVerseJSON(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json(stremioNuvioService.generateCNCVerseJSON());
}

function serveStremioM3U(req: Request, res: Response) {
  const m3u = stremioNuvioService.generateStremioM3U();
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="nexus_stremio_addons.m3u"');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.send(m3u);
}

function serveStremioJSON(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json(stremioNuvioService.getRawJson());
}

app.get('/cncverse.m3u', serveCNCVerseM3U);
app.get('/cncverse.m3u8', serveCNCVerseM3U);
app.get('/api/cncverse.m3u', serveCNCVerseM3U);
app.get('/cncverse.json', serveCNCVerseJSON);
app.get('/api/cncverse.json', serveCNCVerseJSON);

app.get('/stremio.m3u', serveStremioM3U);
app.get('/stremio.m3u8', serveStremioM3U);
app.get('/nuvio-stremio.m3u', serveStremioM3U);
app.get('/api/stremio.m3u', serveStremioM3U);
app.get('/stremio.json', serveStremioJSON);
app.get('/api/stremio.json', serveStremioJSON);

// Vite Integration & Static Hosting
async function startServer() {
  await playlistService.init();

  const distCandidate1 = path.resolve(__dirname, 'dist');
  const distCandidate2 = __dirname;
  const distCandidate3 = path.resolve(process.cwd(), 'dist');

  const distPath = [distCandidate1, distCandidate2, distCandidate3].find(
    (dir) => fs.existsSync(path.join(dir, 'index.html'))
  );

  const isProd = process.env.NODE_ENV === 'production' || distPath !== undefined;

  if (isProd && distPath) {
    console.log(`[Server] Serving production static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/playlist') ||
        req.path.startsWith('/nexusempire') ||
        req.path.startsWith('/aninexus') ||
        req.path.endsWith('.m3u') ||
        req.path.endsWith('.m3u8')
      ) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('[Server] Mounting Vite dev server middleware');
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Nexus] Engine running at http://${HOST}:${PORT}`);
    console.log(`[Nexus] Master M3U: http://${HOST}:${PORT}/api/playlist/all.m3u`);
    console.log(`[Nexus] NexusEmpire Master M3U: http://${HOST}:${PORT}/api/nexusempire/all.m3u`);
  });
}

// ============================================================
// DEDICATED EVENTS & STREAMS ENDPOINTS (FanCode, SonyLIV, Zee5)
// ============================================================
app.get('/api/events/:service', (req: Request, res: Response) => {
  const service = req.params.service.toLowerCase();
  if (service === 'all') {
    return res.json(eventsService.getAllEvents());
  }
  if (service === 'fancode' || service === 'sonyliv' || service === 'zee5') {
    return res.json(eventsService.getEvents(service));
  }
  return res.status(404).json({ error: 'Service not found. Valid services: fancode, sonyliv, zee5, all' });
});

app.get('/api/events/:service.m3u', (req: Request, res: Response) => {
  const service = req.params.service.toLowerCase() as any;
  const m3u = eventsService.generateM3U(service);
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${service}.m3u"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.send(m3u);
});

// Direct root shortcuts for IPTV Players (OTT Navigator, TiviMate)
app.get('/fancode.m3u', (req, res) => {
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.send(eventsService.generateM3U('fancode'));
});

app.get('/sonyliv.m3u', (req, res) => {
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.send(eventsService.generateM3U('sonyliv'));
});

app.get('/zee5.m3u', (req, res) => {
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.send(eventsService.generateM3U('zee5'));
});

app.post('/api/events/sync', async (req, res) => {
  try {
    await eventsService.syncAll();
    return res.json({ success: true, count: eventsService.getAllEvents().length });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// External raw JSON endpoints for compatibility
app.get('/api/external/fancode', (req, res) => {
  return res.json(eventsService.getEvents('fancode'));
});

app.get('/api/external/sony', (req, res) => {
  return res.json(eventsService.getEvents('sonyliv'));
});

app.get('/api/external/zee5', (req, res) => {
  return res.json(eventsService.getEvents('zee5'));
});

// Event Editing & Management Routes
app.put('/api/events/:id', (req: Request, res: Response) => {
  try {
    const { title, category, logo, url, enabled } = req.body;
    const ok = eventsService.updateEvent(req.params.id, { title, category, logo, url, enabled });
    return res.json({ success: ok });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

app.delete('/api/events/:id', (req: Request, res: Response) => {
  try {
    const ok = eventsService.deleteEvent(req.params.id);
    return res.json({ success: ok });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/events', (req: Request, res: Response) => {
  try {
    const { title, category, logo, url, service } = req.body;
    if (!title || !url || !service) return res.status(400).json({ error: 'title, url and service are required' });
    const created = eventsService.addCustomEvent({
      title,
      category: category || `${service.toUpperCase()} Custom`,
      sport: 'Sports',
      status: 'LIVE',
      logo: logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547',
      url,
      service: service as any,
    });
    return res.json({ success: true, event: created });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/events/bulk-category-logo', (req: Request, res: Response) => {
  try {
    const { service, categoryName, logoUrl } = req.body;
    if (!categoryName || !logoUrl) return res.status(400).json({ error: 'categoryName and logoUrl are required' });
    const count = eventsService.bulkSetCategoryLogo(service || 'all', categoryName, logoUrl);
    return res.json({ success: true, count });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/events/rename-category', (req: Request, res: Response) => {
  try {
    const { service, oldCategory, newCategory } = req.body;
    if (!oldCategory || !newCategory) return res.status(400).json({ error: 'oldCategory and newCategory are required' });
    const count = eventsService.renameCategory(service || 'all', oldCategory, newCategory);
    return res.json({ success: true, count });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});

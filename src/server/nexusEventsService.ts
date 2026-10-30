import fs from 'fs';
import path from 'path';
import { NexusEventMatch, NexusEventStream } from '../types';

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'nexus-events.json');

const DEFAULT_MATCHES: NexusEventMatch[] = [
  {
    id: 'match-ipl-live',
    slug: 'ipl-live-match',
    title: 'IPL 2025: Chennai Super Kings vs Royal Challengers Bengaluru',
    sport: 'Cricket',
    category: 'IPL 2025',
    status: 'LIVE',
    startTime: 'Today, 19:30 IST',
    poster: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    description: 'High-octane Indian Premier League clash with multi-angle and multi-language live streams.',
    streams: [
      {
        id: 'stream_ipl_1',
        title: 'Star Sports 1 Hindi HD (Primary)',
        url: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.m3u',
        serverLabel: 'Server 1 - Hindi Commentary HD',
        logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        quality: '1080p 50fps',
        sourceService: 'Live Feeds',
        enabled: true,
      },
      {
        id: 'stream_ipl_2',
        title: 'Star Sports 1 English 4K (Ultra HD)',
        url: 'https://raw.githubusercontent.com/doctor-8trange/zyphx8/refs/heads/main/data/fancode.m3u',
        serverLabel: 'Server 2 - English 4K Ultra HD',
        logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        quality: '4K UHD',
        sourceService: 'FanCode / Jio',
        enabled: true,
      },
      {
        id: 'stream_ipl_3',
        title: 'Willow Cricket HD (USA & Global)',
        url: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.m3u',
        serverLabel: 'Server 3 - Willow Cricket Global',
        logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        quality: '1080p',
        sourceService: 'Willow TV',
        enabled: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'match-ucl-final',
    slug: 'ucl-live-stream',
    title: 'UEFA Champions League: Real Madrid vs Manchester City',
    sport: 'Football',
    category: 'UEFA Champions League',
    status: 'LIVE',
    startTime: 'Tonight, 20:45 CET',
    poster: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    description: 'European powerhouse heavyweight showdown with multiple commentary feeds.',
    streams: [
      {
        id: 'stream_ucl_1',
        title: 'Sony Sports Ten 2 HD - English',
        url: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.m3u',
        serverLabel: 'Server 1 - Sony Ten 2 HD English',
        logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        quality: '1080p HD',
        sourceService: 'SonyLIV',
        enabled: true,
      },
      {
        id: 'stream_ucl_2',
        title: 'Sony Sports Ten 3 HD - Hindi',
        url: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.m3u',
        serverLabel: 'Server 2 - Sony Ten 3 HD Hindi',
        logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        quality: '1080p HD',
        sourceService: 'SonyLIV',
        enabled: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class NexusEventsService {
  private matches: NexusEventMatch[] = [];

  constructor() {
    this.ensureDirs();
    this.load();
  }

  private ensureDirs() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Failed to create data dir for NexusEventsService:', err);
      }
    }
  }

  private load() {
    try {
      if (fs.existsSync(EVENTS_FILE)) {
        const raw = fs.readFileSync(EVENTS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.matches = parsed;
          return;
        }
      }
    } catch (err) {
      console.error('Failed to load nexus-events.json:', err);
    }
    this.matches = [...DEFAULT_MATCHES];
    this.save();
  }

  private save() {
    try {
      this.ensureDirs();
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(this.matches, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save nexus-events.json:', err);
    }
  }

  public getAll(): NexusEventMatch[] {
    return this.matches;
  }

  public getById(idOrSlug: string): NexusEventMatch | undefined {
    const clean = idOrSlug.toLowerCase().trim();
    return this.matches.find(
      (m) => m.id.toLowerCase() === clean || m.slug.toLowerCase() === clean
    );
  }

  public create(data: Partial<NexusEventMatch>): NexusEventMatch {
    const id = data.id || `event_${Date.now()}`;
    const slug = (data.slug || data.title || id)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-');

    const newMatch: NexusEventMatch = {
      id,
      slug,
      title: data.title || 'Live Match Event',
      sport: data.sport || 'Sports',
      category: data.category || 'Live Events',
      status: data.status || 'LIVE',
      startTime: data.startTime || 'Now Live',
      poster: data.poster || 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
      logo: data.logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
      description: data.description || '',
      streams: Array.isArray(data.streams) ? data.streams : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.matches.push(newMatch);
    this.save();
    return newMatch;
  }

  public update(id: string, updates: Partial<NexusEventMatch>): NexusEventMatch | null {
    const idx = this.matches.findIndex((m) => m.id === id || m.slug === id);
    if (idx === -1) return null;

    const current = this.matches[idx];
    const updated: NexusEventMatch = {
      ...current,
      ...updates,
      id: current.id,
      updatedAt: new Date().toISOString(),
    };

    if (updates.slug) {
      updated.slug = updates.slug
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-');
    }

    this.matches[idx] = updated;
    this.save();
    return updated;
  }

  public delete(id: string): boolean {
    const prevLen = this.matches.length;
    this.matches = this.matches.filter((m) => m.id !== id && m.slug !== id);
    if (this.matches.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public addStreamToMatch(matchId: string, stream: Partial<NexusEventStream>): NexusEventStream {
    const match = this.getById(matchId);
    if (!match) throw new Error('Match event not found');

    const newStream: NexusEventStream = {
      id: stream.id || `stream_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: stream.title || 'Live Stream',
      url: (stream.url || '').replace(/:8443/g, '').replace(/:3000/g, ''),
      serverLabel: stream.serverLabel || `Server ${match.streams.length + 1}`,
      logo: stream.logo || match.logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
      quality: stream.quality || 'Auto HD',
      sourceService: stream.sourceService || 'Live Relay',
      enabled: stream.enabled !== false,
    };

    match.streams.push(newStream);
    match.updatedAt = new Date().toISOString();
    this.save();
    return newStream;
  }

  public removeStreamFromMatch(matchId: string, streamId: string): boolean {
    const match = this.getById(matchId);
    if (!match) return false;

    const prevLen = match.streams.length;
    match.streams = match.streams.filter((s) => s.id !== streamId);
    if (match.streams.length !== prevLen) {
      match.updatedAt = new Date().toISOString();
      this.save();
      return true;
    }
    return false;
  }

  public bulkApplyLogoToMatchStreams(matchId: string, logoUrl: string): number {
    const match = this.getById(matchId);
    if (!match) return 0;

    match.logo = logoUrl;
    match.poster = logoUrl;
    let count = 0;
    for (const s of match.streams) {
      s.logo = logoUrl;
      count++;
    }
    match.updatedAt = new Date().toISOString();
    this.save();
    return count;
  }

  public generateM3U(idOrSlug?: string): string {
    const lines: string[] = ['#EXTM3U'];

    const targetMatches =
      idOrSlug && idOrSlug !== 'all'
        ? [this.getById(idOrSlug)].filter((x): x is NexusEventMatch => Boolean(x))
        : this.matches;

    if (targetMatches.length === 0) {
      return '#EXTM3U\n# No active live event matches found\n';
    }

    for (const match of targetMatches) {
      const groupTitle = `${match.sport} - ${match.category}`;
      const matchLogo = match.logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png';

      for (const s of match.streams) {
        if (s.enabled === false) continue;
        const channelName = `[${match.status}] ${match.title} (${s.serverLabel})`;
        const streamLogo = s.logo || matchLogo;

        lines.push(
          `#EXTINF:-1 tvg-id="${match.slug}" tvg-name="${match.title}" tvg-logo="${streamLogo}" group-title="${groupTitle}",${channelName}`
        );
        lines.push(s.url.replace(/:8443/g, '').replace(/:3000/g, ''));
      }
    }

    return lines.join('\n');
  }

  public generateJSON(idOrSlug?: string): any {
    if (idOrSlug && idOrSlug !== 'all') {
      const match = this.getById(idOrSlug);
      if (!match) return { error: 'Event match not found' };
      return match;
    }
    return {
      totalMatches: this.matches.length,
      liveCount: this.matches.filter((m) => m.status === 'LIVE').length,
      matches: this.matches,
    };
  }
}

export const nexusEventsService = new NexusEventsService();

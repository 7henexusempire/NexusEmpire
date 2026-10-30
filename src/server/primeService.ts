import fs from 'fs';
import path from 'path';
import { NexusPrimePlaylist, NexusPrimeStream } from '../types';

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const PRIME_FILE = path.join(DATA_DIR, 'nexusprime.json');

const DEFAULT_PRIME_PLAYLISTS: NexusPrimePlaylist[] = [
  {
    id: 'prime-master',
    slug: 'nexus-prime',
    name: 'Nexus Prime Ultimate Master',
    description: 'Master curated VIP bouquet featuring premier sports, live cinema, events & regional streams.',
    groupLogos: {
      'Live Sports & Cricket': 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
      'Cinema & Blockbusters': 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
      'Live Events & Shows': 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    },
    streams: [
      {
        id: 'prime_s1',
        name: 'Sony Sports Ten 1 HD',
        url: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.m3u',
        groupTitle: 'Live Sports & Cricket',
        logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        groupLogo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        tvgId: 'SonyTen1.in',
        tvgName: 'Sony Ten 1 HD',
        enabled: true,
        sourceOrigin: 'Sony Network',
      },
      {
        id: 'prime_s2',
        name: 'Sony Sports Ten 2 HD',
        url: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.m3u',
        groupTitle: 'Live Sports & Cricket',
        logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        groupLogo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        tvgId: 'SonyTen2.in',
        tvgName: 'Sony Ten 2 HD',
        enabled: true,
        sourceOrigin: 'Sony Network',
      },
      {
        id: 'prime_s3',
        name: 'Sony Sports Ten 5 HD',
        url: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.m3u',
        groupTitle: 'Live Sports & Cricket',
        logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        groupLogo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        tvgId: 'SonyTen5.in',
        tvgName: 'Sony Ten 5 HD',
        enabled: true,
        sourceOrigin: 'Sony Network',
      },
      {
        id: 'prime_s4',
        name: 'FanCode Premier Live Match',
        url: 'https://raw.githubusercontent.com/doctor-8trange/zyphx8/refs/heads/main/data/fancode.m3u',
        groupTitle: 'Live Sports & Cricket',
        logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        groupLogo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        tvgId: 'FanCode.Live',
        tvgName: 'FanCode Live',
        enabled: true,
        sourceOrigin: 'FanCode Live',
      },
      {
        id: 'prime_s5',
        name: 'Zee TV HD',
        url: 'https://raw.githubusercontent.com/doctor-8trange/quarnex/refs/heads/main/data/zee5.m3u',
        groupTitle: 'Cinema & Blockbusters',
        logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        groupLogo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        tvgId: 'ZeeTV.in',
        tvgName: 'Zee TV HD',
        enabled: true,
        sourceOrigin: 'Zee5 Live',
      },
      {
        id: 'prime_s6',
        name: 'Zee Cinema HD',
        url: 'https://raw.githubusercontent.com/doctor-8trange/quarnex/refs/heads/main/data/zee5.m3u',
        groupTitle: 'Cinema & Blockbusters',
        logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        groupLogo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        tvgId: 'ZeeCinema.in',
        tvgName: 'Zee Cinema HD',
        enabled: true,
        sourceOrigin: 'Zee5 Live',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class PrimeService {
  private playlists: NexusPrimePlaylist[] = [];

  constructor() {
    this.ensureDirs();
    this.load();
  }

  private ensureDirs() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Failed to create data dir for PrimeService:', err);
      }
    }
  }

  private load() {
    try {
      if (fs.existsSync(PRIME_FILE)) {
        const raw = fs.readFileSync(PRIME_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.playlists = parsed;
          return;
        }
      }
    } catch (err) {
      console.error('Failed to load nexusprime.json, falling back to defaults:', err);
    }
    this.playlists = [...DEFAULT_PRIME_PLAYLISTS];
    this.save();
  }

  private save() {
    try {
      this.ensureDirs();
      fs.writeFileSync(PRIME_FILE, JSON.stringify(this.playlists, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save nexusprime.json:', err);
    }
  }

  public getAll(): NexusPrimePlaylist[] {
    return this.playlists;
  }

  public getById(idOrSlug: string): NexusPrimePlaylist | undefined {
    const clean = idOrSlug.toLowerCase().trim();
    return this.playlists.find(
      (p) => p.id.toLowerCase() === clean || p.slug.toLowerCase() === clean
    );
  }

  public create(data: Partial<NexusPrimePlaylist>): NexusPrimePlaylist {
    const id = data.id || `prime_${Date.now()}`;
    const slug = (data.slug || data.name || id)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-');

    const newP: NexusPrimePlaylist = {
      id,
      slug,
      name: data.name || 'Custom Nexus Prime Playlist',
      description: data.description || 'Custom crafted playlist with Nexus Prime Studio',
      streams: Array.isArray(data.streams) ? data.streams : [],
      groupLogos: data.groupLogos || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.playlists.push(newP);
    this.save();
    return newP;
  }

  public update(id: string, updates: Partial<NexusPrimePlaylist>): NexusPrimePlaylist | null {
    const idx = this.playlists.findIndex((p) => p.id === id || p.slug === id);
    if (idx === -1) return null;

    const current = this.playlists[idx];
    const updated: NexusPrimePlaylist = {
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

    this.playlists[idx] = updated;
    this.save();
    return updated;
  }

  public delete(id: string): boolean {
    const prevLen = this.playlists.length;
    this.playlists = this.playlists.filter((p) => p.id !== id && p.slug !== id);
    if (this.playlists.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public addStream(playlistId: string, stream: Partial<NexusPrimeStream>): NexusPrimeStream {
    const pl = this.getById(playlistId);
    if (!pl) throw new Error('Playlist not found');

    const newStream: NexusPrimeStream = {
      id: stream.id || `stream_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: stream.name || 'Stream Channel',
      url: (stream.url || '').replace(/:8443/g, '').replace(/:3000/g, ''),
      groupTitle: stream.groupTitle || 'General',
      logo: stream.logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
      groupLogo: stream.groupLogo,
      tvgId: stream.tvgId || '',
      tvgName: stream.tvgName || stream.name || '',
      tvgChno: stream.tvgChno || '',
      enabled: stream.enabled !== false,
      sourceOrigin: stream.sourceOrigin || 'Nexus Pool',
    };

    pl.streams.push(newStream);
    pl.updatedAt = new Date().toISOString();
    this.save();
    return newStream;
  }

  public addMultipleStreams(playlistId: string, streams: Partial<NexusPrimeStream>[]): number {
    const pl = this.getById(playlistId);
    if (!pl) throw new Error('Playlist not found');

    let count = 0;
    for (const stream of streams) {
      if (!stream.url) continue;
      const cleanUrl = stream.url.replace(/:8443/g, '').replace(/:3000/g, '');
      const newStream: NexusPrimeStream = {
        id: stream.id || `stream_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: stream.name || 'Stream Channel',
        url: cleanUrl,
        groupTitle: stream.groupTitle || 'General',
        logo: stream.logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
        groupLogo: stream.groupLogo,
        tvgId: stream.tvgId || '',
        tvgName: stream.tvgName || stream.name || '',
        tvgChno: stream.tvgChno || '',
        enabled: stream.enabled !== false,
        sourceOrigin: stream.sourceOrigin || 'Nexus Pool',
      };
      pl.streams.push(newStream);
      count++;
    }
    pl.updatedAt = new Date().toISOString();
    this.save();
    return count;
  }

  public removeStream(playlistId: string, streamId: string): boolean {
    const pl = this.getById(playlistId);
    if (!pl) return false;

    const prevLen = pl.streams.length;
    pl.streams = pl.streams.filter((s) => s.id !== streamId);
    if (pl.streams.length !== prevLen) {
      pl.updatedAt = new Date().toISOString();
      this.save();
      return true;
    }
    return false;
  }

  public updateStream(
    playlistId: string,
    streamId: string,
    updates: Partial<NexusPrimeStream>
  ): boolean {
    const pl = this.getById(playlistId);
    if (!pl) return false;

    const stream = pl.streams.find((s) => s.id === streamId);
    if (!stream) return false;

    if (updates.name !== undefined) stream.name = updates.name;
    if (updates.url !== undefined) {
      stream.url = updates.url.replace(/:8443/g, '').replace(/:3000/g, '');
    }
    if (updates.groupTitle !== undefined) stream.groupTitle = updates.groupTitle;
    if (updates.logo !== undefined) stream.logo = updates.logo;
    if (updates.groupLogo !== undefined) stream.groupLogo = updates.groupLogo;
    if (updates.tvgId !== undefined) stream.tvgId = updates.tvgId;
    if (updates.tvgName !== undefined) stream.tvgName = updates.tvgName;
    if (updates.tvgChno !== undefined) stream.tvgChno = updates.tvgChno;
    if (updates.enabled !== undefined) stream.enabled = updates.enabled;

    pl.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  public bulkApplyCategoryLogo(playlistId: string, category: string, logoUrl: string): number {
    const pl = this.getById(playlistId);
    if (!pl) return 0;

    let updated = 0;
    if (!pl.groupLogos) pl.groupLogos = {};
    pl.groupLogos[category] = logoUrl;

    for (const stream of pl.streams) {
      if (stream.groupTitle === category) {
        stream.logo = logoUrl;
        stream.groupLogo = logoUrl;
        updated++;
      }
    }

    pl.updatedAt = new Date().toISOString();
    this.save();
    return updated;
  }

  public bulkApplyAllLogo(playlistId: string, logoUrl: string): number {
    const pl = this.getById(playlistId);
    if (!pl) return 0;

    let updated = 0;
    for (const stream of pl.streams) {
      stream.logo = logoUrl;
      stream.groupLogo = logoUrl;
      updated++;
    }

    if (!pl.groupLogos) pl.groupLogos = {};
    const categories = new Set(pl.streams.map((s) => s.groupTitle));
    categories.forEach((cat) => {
      pl.groupLogos![cat] = logoUrl;
    });

    pl.updatedAt = new Date().toISOString();
    this.save();
    return updated;
  }

  public generateM3U(idOrSlug: string): string {
    const pl = this.getById(idOrSlug);
    if (!pl) {
      return '#EXTM3U\n# Error: Nexus Prime Playlist not found\n';
    }

    const lines: string[] = [
      '#EXTM3U',
      `# Nexus Prime: ${pl.name}`,
      `# Updated: ${pl.updatedAt}`,
      '',
    ];

    for (const s of pl.streams) {
      if (s.enabled === false) continue;
      const tvgId = s.tvgId ? ` tvg-id="${s.tvgId}"` : '';
      const tvgName = s.tvgName ? ` tvg-name="${s.tvgName}"` : ` tvg-name="${s.name}"`;
      const tvgLogo = s.logo ? ` tvg-logo="${s.logo}"` : '';
      const groupTitle = s.groupTitle ? ` group-title="${s.groupTitle}"` : ' group-title="Nexus Prime"';
      const groupLogo = s.groupLogo ? ` group-logo="${s.groupLogo}"` : '';
      const tvgChno = s.tvgChno ? ` tvg-chno="${s.tvgChno}"` : '';

      lines.push(`#EXTINF:-1${tvgId}${tvgName}${tvgLogo}${groupTitle}${groupLogo}${tvgChno},${s.name}`);
      lines.push((s.url || '').replace(/:8443/g, '').replace(/:3000/g, ''));
    }

    return lines.join('\n');
  }

  public generateJSON(idOrSlug: string): any {
    const pl = this.getById(idOrSlug);
    if (!pl) return { error: 'Playlist not found' };
    return {
      id: pl.id,
      slug: pl.slug,
      name: pl.name,
      description: pl.description,
      totalStreams: pl.streams.length,
      groupLogos: pl.groupLogos || {},
      streams: pl.streams,
      createdAt: pl.createdAt,
      updatedAt: pl.updatedAt,
    };
  }
}

export const primeService = new PrimeService();

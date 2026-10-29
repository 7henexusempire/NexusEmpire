import { ChannelItem, SportsEventItem } from '../types';

interface ServiceSourceConfig {
  primaryJson: string;
  primaryM3u: string;
  backupJson?: string;
  backupM3u?: string;
}

const SOURCES: Record<'fancode' | 'sonyliv' | 'zee5', ServiceSourceConfig> = {
  fancode: {
    primaryJson: 'https://raw.githubusercontent.com/doctor-8trange/zyphx8/refs/heads/main/data/fancode.json',
    primaryM3u: 'https://raw.githubusercontent.com/doctor-8trange/zyphx8/refs/heads/main/data/fancode.m3u',
    backupJson: 'https://raw.githubusercontent.com/drmlive/fancode-live-events/refs/heads/main/fancode.json',
    backupM3u: 'https://raw.githubusercontent.com/drmlive/fancode-live-events/refs/heads/main/fancode.m3u',
  },
  sonyliv: {
    primaryJson: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.json',
    primaryM3u: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.m3u',
    backupJson: 'https://raw.githubusercontent.com/drmlive/sliv-live-events/refs/heads/main/sonyliv.json',
    backupM3u: 'https://raw.githubusercontent.com/drmlive/sliv-live-events/refs/heads/main/sonyliv.m3u',
  },
  zee5: {
    primaryJson: 'https://raw.githubusercontent.com/doctor-8trange/quarnex/refs/heads/main/data/zee5.json',
    primaryM3u: 'https://raw.githubusercontent.com/doctor-8trange/quarnex/refs/heads/main/data/zee5.m3u',
  },
};

export class EventsService {
  private events: Record<'fancode' | 'sonyliv' | 'zee5', SportsEventItem[]> = {
    fancode: [],
    sonyliv: [],
    zee5: [],
  };

  private m3uContent: Record<'fancode' | 'sonyliv' | 'zee5', string> = {
    fancode: '',
    sonyliv: '',
    zee5: '',
  };

  private lastFetchTime: Record<'fancode' | 'sonyliv' | 'zee5', string | null> = {
    fancode: null,
    sonyliv: null,
    zee5: null,
  };

  private isFetching = false;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startAutoSync();
  }

  public startAutoSync() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }
    // 7 minutes sync interval
    const intervalMs = 7 * 60 * 1000;
    this.intervalTimer = setInterval(() => {
      this.syncAll().catch((err) => console.error('[EventsService] Auto-sync error:', err));
    }, intervalMs);

    // Initial fetch in background
    setTimeout(() => {
      this.syncAll().catch((err) => console.error('[EventsService] Initial fetch error:', err));
    }, 1500);
  }

  private async fetchWithFallback(primaryUrl: string, backupUrl?: string, isJson = false): Promise<any> {
    try {
      const res = await fetch(primaryUrl, {
        headers: { 'User-Agent': 'NexusEmpire/1.0' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return isJson ? await res.json() : await res.text();
    } catch (primaryErr) {
      if (backupUrl) {
        console.warn(`[EventsService] Primary URL failed (${primaryUrl}), trying backup...`);
        try {
          const resBackup = await fetch(backupUrl, {
            headers: { 'User-Agent': 'NexusEmpire/1.0' },
            signal: AbortSignal.timeout(15000),
          });
          if (!resBackup.ok) throw new Error(`HTTP ${resBackup.status}`);
          return isJson ? await resBackup.json() : await resBackup.text();
        } catch (backupErr) {
          throw new Error(`Both primary and backup failed: ${backupErr}`);
        }
      }
      throw primaryErr;
    }
  }

  public async fetchService(service: 'fancode' | 'sonyliv' | 'zee5') {
    const config = SOURCES[service];
    let jsonData: any = null;
    let m3uText = '';

    // Fetch JSON
    try {
      jsonData = await this.fetchWithFallback(config.primaryJson, config.backupJson, true);
    } catch (err: any) {
      console.warn(`[EventsService] Failed to fetch ${service} JSON:`, err.message);
    }

    // Fetch M3U
    try {
      m3uText = await this.fetchWithFallback(config.primaryM3u, config.backupM3u, false);
      if (m3uText) {
        this.m3uContent[service] = m3uText;
      }
    } catch (err: any) {
      console.warn(`[EventsService] Failed to fetch ${service} M3U:`, err.message);
    }

    // Extract stream mappings from M3U
    const streamMap = new Map<string, { url: string; logo?: string; group?: string; directives?: string[] }>();
    if (m3uText) {
      const lines = m3uText.split(/\r?\n/);
      let currentName = '';
      let currentLogo = '';
      let currentGroup = '';
      let currentDirectives: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('#EXTINF:')) {
          const nameMatch = line.match(/,(.+)$/);
          currentName = nameMatch ? nameMatch[1].trim() : '';

          const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
          currentLogo = logoMatch ? logoMatch[1] : '';

          const groupMatch = line.match(/group-title="([^"]*)"/i);
          currentGroup = groupMatch ? groupMatch[1] : '';
          currentDirectives = [];
        } else if (line.startsWith('#')) {
          currentDirectives.push(line);
        } else if (/^(https?|rtmp|udp|rtsp):\/\//i.test(line)) {
          if (currentName) {
            const key = currentName.toLowerCase().replace(/[^a-z0-9]/g, '');
            streamMap.set(key, {
              url: line,
              logo: currentLogo,
              group: currentGroup,
              directives: [...currentDirectives],
            });
            streamMap.set(currentName.toLowerCase(), {
              url: line,
              logo: currentLogo,
              group: currentGroup,
              directives: [...currentDirectives],
            });
          }
        }
      }
    }

    // Parse items from JSON or M3U
    const parsedEvents: SportsEventItem[] = [];

    if (Array.isArray(jsonData)) {
      for (let i = 0; i < jsonData.length; i++) {
        const item = jsonData[i];
        const title = item.title || item.name || item.event_name || item.match_name || `Event ${i + 1}`;
        const key = title.toLowerCase().replace(/[^a-z0-9]/g, '');

        let streamUrl = item.stream_url || item.url || item.adfree_url || item.adfree_stream || item.link || '';
        let logo = item.image || item.logo || item.src || item.banner || item.poster || '';

        // If JSON doesn't contain playable URL, match from parsed M3U
        const matched = streamMap.get(key) || streamMap.get(title.toLowerCase());
        if (matched) {
          if (!streamUrl) streamUrl = matched.url;
          if (!logo && matched.logo) logo = matched.logo;
        }

        const isLive = item.is_live || item.status === 'LIVE' || item.live || (title.toLowerCase().includes('live'));

        parsedEvents.push({
          id: `${service}_${item.id || i}_${Date.now()}`,
          title,
          category: item.category || item.tournament_name || item.event_category || matched?.group || (service === 'fancode' ? 'Cricket & Sports' : service === 'sonyliv' ? 'Sony Sports' : 'Zee Live'),
          sport: item.sport || item.sport_type || 'Sports',
          status: isLive ? 'LIVE' : (item.status || 'UPCOMING'),
          startTime: item.start_time || item.startTime || item.time || '',
          endTime: item.end_time || '',
          poster: item.banner || item.poster || item.image || logo,
          logo: logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547',
          url: streamUrl || (matched ? matched.url : ''),
          service,
          raw: item,
        });
      }
    } else if (m3uText) {
      // If JSON was not array or failed, build events directly from M3U
      let idx = 0;
      for (const [name, meta] of streamMap.entries()) {
        if (!meta.url) continue;
        parsedEvents.push({
          id: `${service}_m3u_${idx++}`,
          title: name,
          category: meta.group || `${service.toUpperCase()} Live`,
          status: 'LIVE',
          logo: meta.logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547',
          url: meta.url,
          service,
        });
      }
    }

    if (parsedEvents.length > 0) {
      this.events[service] = parsedEvents;
      this.lastFetchTime[service] = new Date().toISOString();
    }
  }

  public async syncAll() {
    if (this.isFetching) return;
    this.isFetching = true;
    try {
      await Promise.allSettled([
        this.fetchService('fancode'),
        this.fetchService('sonyliv'),
        this.fetchService('zee5'),
      ]);
      console.log(`[EventsService] 7-Min Sync Complete: FanCode (${this.events.fancode.length}), SonyLIV (${this.events.sonyliv.length}), Zee5 (${this.events.zee5.length})`);
    } finally {
      this.isFetching = false;
    }
  }

  public getEvents(service: 'fancode' | 'sonyliv' | 'zee5'): SportsEventItem[] {
    return this.events[service] || [];
  }

  public getAllEvents(): SportsEventItem[] {
    return [...this.events.fancode, ...this.events.sonyliv, ...this.events.zee5];
  }

  public generateM3U(service: 'fancode' | 'sonyliv' | 'zee5' | 'all'): string {
    const list = service === 'all' ? this.getAllEvents() : this.getEvents(service);
    const serviceName = service.toUpperCase();

    const lines: string[] = [
      '#EXTM3U url-tvg="https://avkb.short.gy/jioepg.xml.gz" x-tvg-url="https://epgshare01.online/epgshare01/epg_ripper_IN4.xml.gz" refresh="420"',
      `# ${serviceName} Live Events & Streams · Nexus Empire Hub`,
      `# Auto-refreshed every 7 minutes`,
      `# Total streams: ${list.length}`,
    ];

    for (const item of list) {
      if (!item.url) continue;
      const logo = item.logo || item.poster || 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547';
      const cat = item.category || `${item.service.toUpperCase()} LIVE`;
      const title = item.title;

      lines.push('');
      lines.push(`#EXTINF:-1 tvg-id="${item.id}" tvg-name="${title}" tvg-logo="${logo}" group-title="${cat}",${title}`);
      lines.push(item.url);
    }

    return lines.join('\n');
  }

  public getRawM3U(service: 'fancode' | 'sonyliv' | 'zee5'): string {
    return this.m3uContent[service] || this.generateM3U(service);
  }
}

export const eventsService = new EventsService();

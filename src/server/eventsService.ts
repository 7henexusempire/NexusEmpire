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

  private overrides: Record<
    string,
    {
      customTitle?: string;
      customCategory?: string;
      customLogo?: string;
      customUrl?: string;
      enabled?: boolean;
    }
  > = {};

  private deletedIds = new Set<string>();
  private customEvents: SportsEventItem[] = [];

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
    }, 1000);
  }

  private async fetchWithFallback(primaryUrl: string, backupUrl?: string, isJson = false): Promise<any> {
    try {
      const res = await fetch(primaryUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: '*/*',
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return isJson ? await res.json() : await res.text();
    } catch (primaryErr) {
      if (backupUrl) {
        console.warn(`[EventsService] Primary URL failed (${primaryUrl}), trying backup ${backupUrl}...`);
        try {
          const resBackup = await fetch(backupUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: '*/*',
            },
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
        this.m3uContent[service] = m3uText.replace(/:8443/g, '').replace(/:3000/g, '');
      }
    } catch (err: any) {
      console.warn(`[EventsService] Failed to fetch ${service} M3U:`, err.message);
    }

    // Extract stream entries from M3U line-by-line cleanly
    interface M3uStreamEntry {
      title: string;
      logo: string;
      group: string;
      url: string;
    }
    const m3uEntries: M3uStreamEntry[] = [];
    const streamLookup = new Map<string, M3uStreamEntry>();

    if (m3uText) {
      const lines = m3uText.split(/\r?\n/);
      let currentTitle = '';
      let currentLogo = '';
      let currentGroup = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('#EXTINF:')) {
          const nameMatch = line.match(/,(.+)$/);
          currentTitle = nameMatch ? nameMatch[1].trim() : '';

          const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
          currentLogo = logoMatch ? logoMatch[1] : '';

          const groupMatch = line.match(/group-title="([^"]*)"/i);
          currentGroup = groupMatch ? groupMatch[1] : '';
        } else if (/^(https?|rtmp|udp|rtsp):\/\//i.test(line)) {
          const cleanUrl = line.replace(/:8443/g, '').replace(/:3000/g, '');
          if (currentTitle) {
            const entry: M3uStreamEntry = {
              title: currentTitle,
              logo: currentLogo,
              group: currentGroup,
              url: cleanUrl,
            };
            m3uEntries.push(entry);

            const normKey = currentTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!streamLookup.has(normKey)) {
              streamLookup.set(normKey, entry);
            }
          }
        }
      }
    }

    // Extract list array from jsonData if present
    let jsonArray: any[] = [];
    if (Array.isArray(jsonData)) {
      jsonArray = jsonData;
    } else if (jsonData && typeof jsonData === 'object') {
      jsonArray =
        jsonData.matches ||
        jsonData.events ||
        jsonData.data ||
        jsonData.items ||
        jsonData.live_events ||
        jsonData.channels ||
        jsonData.live ||
        [];
    }

    const parsedEvents: SportsEventItem[] = [];

    if (jsonArray.length > 0) {
      for (let i = 0; i < jsonArray.length; i++) {
        const item = jsonArray[i];
        const title =
          item.title || item.name || item.event_name || item.match_name || item.channel_name || `Event ${i + 1}`;
        const normKey = title.toLowerCase().replace(/[^a-z0-9]/g, '');

        let streamUrl =
          item.stream_url || item.url || item.adfree_url || item.adfree_stream || item.link || item.m3u8 || '';
        if (streamUrl) streamUrl = streamUrl.replace(/:8443/g, '').replace(/:3000/g, '');

        let logo = item.image || item.logo || item.src || item.banner || item.poster || item.tvg_logo || '';

        // Match with M3U if streamUrl is missing
        const matched = streamLookup.get(normKey);
        if (matched) {
          if (!streamUrl) streamUrl = matched.url;
          if (!logo && matched.logo) logo = matched.logo;
        }

        const isLive = item.is_live || item.status === 'LIVE' || item.live || title.toLowerCase().includes('live');

        parsedEvents.push({
          id: `${service}_${item.id || i}_${i}`,
          title,
          category:
            item.category ||
            item.tournament_name ||
            item.event_category ||
            matched?.group ||
            (service === 'fancode' ? 'Cricket & Sports' : service === 'sonyliv' ? 'Sony Sports' : 'Zee Live'),
          sport: item.sport || item.sport_type || 'Sports',
          status: isLive ? 'LIVE' : item.status || 'UPCOMING',
          startTime: item.start_time || item.startTime || item.time || '',
          endTime: item.end_time || '',
          poster: item.banner || item.poster || item.image || logo,
          logo: logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547',
          url: streamUrl || (matched ? matched.url : ''),
          service,
          raw: item,
        });
      }
    } else if (m3uEntries.length > 0) {
      // Build events directly from parsed M3U entries if JSON list was empty
      let idx = 0;
      for (const entry of m3uEntries) {
        parsedEvents.push({
          id: `${service}_m3u_${idx++}`,
          title: entry.title,
          category: entry.group || `${service.toUpperCase()} Live`,
          status: 'LIVE',
          logo: entry.logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547',
          url: entry.url,
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
      await Promise.allSettled([this.fetchService('fancode'), this.fetchService('sonyliv'), this.fetchService('zee5')]);
      console.log(
        `[EventsService] 7-Min Sync Complete: FanCode (${this.events.fancode.length}), SonyLIV (${this.events.sonyliv.length}), Zee5 (${this.events.zee5.length})`
      );
    } finally {
      this.isFetching = false;
    }
  }

  public updateEvent(
    id: string,
    updates: {
      title?: string;
      category?: string;
      logo?: string;
      url?: string;
      enabled?: boolean;
    }
  ) {
    if (!this.overrides[id]) this.overrides[id] = {};
    if (updates.title !== undefined) this.overrides[id].customTitle = updates.title;
    if (updates.category !== undefined) this.overrides[id].customCategory = updates.category;
    if (updates.logo !== undefined) this.overrides[id].customLogo = updates.logo;
    if (updates.url !== undefined) this.overrides[id].customUrl = updates.url;
    if (updates.enabled !== undefined) this.overrides[id].enabled = updates.enabled;
    return true;
  }

  public deleteEvent(id: string) {
    this.deletedIds.add(id);
    return true;
  }

  public addCustomEvent(item: Omit<SportsEventItem, 'id'>) {
    const id = `custom_${item.service}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newEvent: SportsEventItem = {
      ...item,
      id,
    };
    this.customEvents.push(newEvent);
    return newEvent;
  }

  public bulkSetCategoryLogo(service: 'fancode' | 'sonyliv' | 'zee5' | 'all', categoryName: string, logoUrl: string) {
    const list = service === 'all' ? this.getAllEvents() : this.getEvents(service);
    let count = 0;
    for (const item of list) {
      if ((item.category || '').toLowerCase() === categoryName.toLowerCase()) {
        if (!this.overrides[item.id]) this.overrides[item.id] = {};
        this.overrides[item.id].customLogo = logoUrl;
        count++;
      }
    }
    return count;
  }

  public renameCategory(service: 'fancode' | 'sonyliv' | 'zee5' | 'all', oldCategory: string, newCategory: string) {
    const list = service === 'all' ? this.getAllEvents() : this.getEvents(service);
    let count = 0;
    for (const item of list) {
      if ((item.category || '').toLowerCase() === oldCategory.toLowerCase()) {
        if (!this.overrides[item.id]) this.overrides[item.id] = {};
        this.overrides[item.id].customCategory = newCategory;
        count++;
      }
    }
    return count;
  }

  public getEvents(service: 'fancode' | 'sonyliv' | 'zee5'): SportsEventItem[] {
    const baseList = [...(this.events[service] || []), ...this.customEvents.filter((e) => e.service === service)];
    return baseList
      .filter((item) => !this.deletedIds.has(item.id))
      .map((item) => {
        const ov = this.overrides[item.id];
        if (!ov) return item;
        return {
          ...item,
          title: ov.customTitle || item.title,
          category: ov.customCategory || item.category,
          logo: ov.customLogo || item.logo,
          url: ov.customUrl || item.url,
          enabled: ov.enabled !== undefined ? ov.enabled : true,
        };
      })
      .filter((item) => item.enabled !== false);
  }

  public getAllEvents(): SportsEventItem[] {
    return [...this.getEvents('fancode'), ...this.getEvents('sonyliv'), ...this.getEvents('zee5')];
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
      const logo =
        item.logo || item.poster || 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547';
      const cat = item.category || `${item.service.toUpperCase()} LIVE`;
      const title = item.title;
      const cleanStreamUrl = item.url.replace(/:8443/g, '').replace(/:3000/g, '');

      lines.push('');
      lines.push(`#EXTINF:-1 tvg-id="${item.id}" tvg-name="${title}" tvg-logo="${logo}" group-title="${cat}",${title}`);
      lines.push(cleanStreamUrl);
    }

    return lines.join('\n');
  }

  public getRawM3U(service: 'fancode' | 'sonyliv' | 'zee5'): string {
    return this.m3uContent[service] || this.generateM3U(service);
  }
}

export const eventsService = new EventsService();

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

  private async fetchRawUrl(url: string, isJson = false): Promise<any> {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: '*/*',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return isJson ? await res.json() : await res.text();
  }

  /**
   * Smart Hybrid Fetcher:
   * Fetches JSON thumbnail details & tournament info + M3U stream URLs for a single server endpoint
   */
  private async fetchSingleServerEvents(
    service: 'fancode' | 'sonyliv' | 'zee5',
    serverId: 'server1' | 'server2',
    jsonUrl: string,
    m3uUrl: string
  ): Promise<SportsEventItem[]> {
    let jsonData: any = null;
    let m3uText = '';

    try {
      jsonData = await this.fetchRawUrl(jsonUrl, true);
    } catch (err: any) {
      console.warn(`[EventsService] ${service} ${serverId} JSON fetch error:`, err.message);
    }

    try {
      m3uText = await this.fetchRawUrl(m3uUrl, false);
    } catch (err: any) {
      console.warn(`[EventsService] ${service} ${serverId} M3U fetch error:`, err.message);
    }

    // Parse M3U stream entries
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

    // Parse JSON items
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

    const items: SportsEventItem[] = [];

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

        // Match with M3U for missing streamUrl or logo
        const matched = streamLookup.get(normKey);
        if (matched) {
          if (!streamUrl) streamUrl = matched.url;
          if (!logo && matched.logo) logo = matched.logo;
        }

        const isLive = item.is_live || item.status === 'LIVE' || item.live || title.toLowerCase().includes('live');

        // Keep category names clean without Server 1 or Server 2 labels
        const cleanCategory =
          item.category ||
          item.tournament_name ||
          item.event_category ||
          matched?.group ||
          (service === 'fancode' ? 'Cricket & Sports' : service === 'sonyliv' ? 'Sony Sports' : 'Zee Live');

        items.push({
          id: `${service}_${serverId}_${item.id || i}_${i}`,
          title,
          category: cleanCategory,
          sport: item.sport || item.sport_type || 'Sports',
          status: isLive ? 'LIVE' : item.status || 'UPCOMING',
          startTime: item.start_time || item.startTime || item.time || '',
          endTime: item.end_time || '',
          poster: item.banner || item.poster || item.image || logo,
          logo: logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547',
          url: streamUrl || (matched ? matched.url : ''),
          service,
          serverId,
          raw: item,
        });
      }
    } else if (m3uEntries.length > 0) {
      let idx = 0;
      for (const entry of m3uEntries) {
        items.push({
          id: `${service}_${serverId}_m3u_${idx++}`,
          title: entry.title,
          category: entry.group || `${service.toUpperCase()} Live`,
          status: 'LIVE',
          logo: entry.logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547',
          url: entry.url,
          service,
          serverId,
        });
      }
    }

    return items;
  }

  public async fetchService(service: 'fancode' | 'sonyliv' | 'zee5') {
    const config = SOURCES[service];
    const server1Items = await this.fetchSingleServerEvents(
      service,
      'server1',
      config.primaryJson,
      config.primaryM3u
    );

    let server2Items: SportsEventItem[] = [];
    if (config.backupJson && config.backupM3u) {
      server2Items = await this.fetchSingleServerEvents(
        service,
        'server2',
        config.backupJson,
        config.backupM3u
      );
    }

    const combined = [...server1Items, ...server2Items];
    if (combined.length > 0) {
      this.events[service] = combined;
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
      console.log(
        `[EventsService] Multi-Server Sync Complete: FanCode (${this.events.fancode.length}), SonyLIV (${this.events.sonyliv.length}), Zee5 (${this.events.zee5.length})`
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
  }

  public deleteEvent(id: string) {
    this.deletedIds.add(id);
  }

  public addCustomEvent(event: Partial<SportsEventItem>): SportsEventItem {
    const id = `custom_event_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newEv: SportsEventItem = {
      id,
      title: event.title || 'Custom Live Event',
      category: event.category || 'Live Events',
      logo: event.logo || 'https://ik.imagekit.io/7henexusempire/nexusprime.png?updatedAt=1793203628547',
      url: event.url || '',
      service: event.service || 'fancode',
      serverId: event.serverId || 'server1',
      status: 'LIVE',
    };
    this.customEvents.push(newEv);
    return newEv;
  }

  public bulkSetCategoryLogo(
    service: 'fancode' | 'sonyliv' | 'zee5' | 'all',
    categoryName: string,
    logoUrl: string
  ) {
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

  public renameCategory(
    service: 'fancode' | 'sonyliv' | 'zee5' | 'all',
    oldCategory: string,
    newCategory: string
  ) {
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

  public getEvents(
    service: 'fancode' | 'sonyliv' | 'zee5',
    serverId?: 'server1' | 'server2' | 'all'
  ): SportsEventItem[] {
    const baseList = [
      ...(this.events[service] || []),
      ...this.customEvents.filter((e) => e.service === service),
    ];

    let filtered = baseList.filter((item) => !this.deletedIds.has(item.id));

    if (serverId && serverId !== 'all') {
      filtered = filtered.filter((item) => item.serverId === serverId);
    }

    return filtered
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
    return [
      ...this.getEvents('fancode'),
      ...this.getEvents('sonyliv'),
      ...this.getEvents('zee5'),
    ];
  }

  public generateM3U(
    service: 'fancode' | 'sonyliv' | 'zee5' | 'all',
    serverId?: 'server1' | 'server2' | 'all'
  ): string {
    const list =
      service === 'all'
        ? this.getAllEvents()
        : this.getEvents(service, serverId);
    const serviceName = service.toUpperCase();

    const lines: string[] = [
      '#EXTM3U url-tvg="https://avkb.short.gy/jioepg.xml.gz" x-tvg-url="https://epgshare01.online/epgshare01/epg_ripper_IN4.xml.gz" refresh="420"',
      `# ${serviceName} Live Events & Streams · Nexus Empire Hub`,
      `# Auto-refreshed every 7 minutes`,
      `# Total streams: ${list.length}`,
    ];

    for (const item of list) {
      if (!item.url) continue;
      const cleanTitle = item.title.replace(/["\n\r]/g, '');
      const cleanGroup = (item.category || 'Live Events').replace(/["\n\r]/g, '');
      const cleanLogo = (item.logo || '').replace(/["\n\r]/g, '');

      lines.push(
        `#EXTINF:-1 tvg-id="${item.id}" tvg-name="${cleanTitle}" tvg-logo="${cleanLogo}" group-title="${cleanGroup}",${cleanTitle}`
      );
      lines.push(item.url);
    }

    return lines.join('\n');
  }
}

export const eventsService = new EventsService();

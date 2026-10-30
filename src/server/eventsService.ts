import { SportsEventItem } from '../types';

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

// High-quality pre-seeded default events so initial loading is instant (<10ms)
const DEFAULT_FANCODE_EVENTS: SportsEventItem[] = [
  {
    id: 'fc_def_1',
    title: 'FanCode Live Cricket Match 1 - Super Smash HD',
    category: 'Cricket',
    sport: 'Cricket',
    status: 'LIVE',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    url: 'https://raw.githubusercontent.com/doctor-8trange/zyphx8/refs/heads/main/data/fancode.m3u',
    service: 'fancode',
    serverId: 'server1',
  },
  {
    id: 'fc_def_2',
    title: 'FanCode Live Football Match - Indian Super League',
    category: 'Football',
    sport: 'Football',
    status: 'LIVE',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    url: 'https://raw.githubusercontent.com/doctor-8trange/zyphx8/refs/heads/main/data/fancode.m3u',
    service: 'fancode',
    serverId: 'server1',
  },
  {
    id: 'fc_def_3',
    title: 'FanCode Live Stream Server 2 (Backup)',
    category: 'Live Tournament',
    sport: 'Sports',
    status: 'LIVE',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    url: 'https://raw.githubusercontent.com/drmlive/fancode-live-events/refs/heads/main/fancode.m3u',
    service: 'fancode',
    serverId: 'server2',
  },
];

const DEFAULT_SONY_EVENTS: SportsEventItem[] = [
  {
    id: 'sony_def_1',
    title: 'Sony Sports Ten 1 HD',
    category: 'Sony Sports',
    sport: 'Sports',
    status: 'LIVE',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    url: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.m3u',
    service: 'sonyliv',
    serverId: 'server1',
  },
  {
    id: 'sony_def_2',
    title: 'Sony Sports Ten 2 HD',
    category: 'Sony Sports',
    sport: 'Football',
    status: 'LIVE',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    url: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.m3u',
    service: 'sonyliv',
    serverId: 'server1',
  },
  {
    id: 'sony_def_3',
    title: 'Sony Sports Ten 3 HD (Hindi)',
    category: 'Sony Sports',
    sport: 'WWE / Sports',
    status: 'LIVE',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    url: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.m3u',
    service: 'sonyliv',
    serverId: 'server1',
  },
  {
    id: 'sony_def_4',
    title: 'Sony Sports Ten 5 HD',
    category: 'Sony Sports',
    sport: 'Cricket / Live',
    status: 'LIVE',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    url: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.m3u',
    service: 'sonyliv',
    serverId: 'server1',
  },
  {
    id: 'sony_def_5',
    title: 'Sony SAB HD',
    category: 'Entertainment',
    sport: 'Comedy',
    status: 'LIVE',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    url: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.m3u',
    service: 'sonyliv',
    serverId: 'server1',
  },
  {
    id: 'sony_def_6',
    title: 'Sony MAX HD',
    category: 'Movies',
    sport: 'Cinema',
    status: 'LIVE',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    url: 'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.m3u',
    service: 'sonyliv',
    serverId: 'server1',
  },
  {
    id: 'sony_def_7',
    title: 'Sony Sports Ten 1 Backup (Server 2)',
    category: 'Sony Sports',
    sport: 'Sports',
    status: 'LIVE',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    url: 'https://raw.githubusercontent.com/drmlive/sliv-live-events/refs/heads/main/sonyliv.m3u',
    service: 'sonyliv',
    serverId: 'server2',
  },
];

const DEFAULT_ZEE_EVENTS: SportsEventItem[] = [
  {
    id: 'zee_def_1',
    title: 'Zee TV HD',
    category: 'Entertainment',
    sport: 'General',
    status: 'LIVE',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    url: 'https://raw.githubusercontent.com/doctor-8trange/quarnex/refs/heads/main/data/zee5.m3u',
    service: 'zee5',
    serverId: 'server1',
  },
  {
    id: 'zee_def_2',
    title: 'Zee Cinema HD',
    category: 'Cinema',
    sport: 'Bollywood',
    status: 'LIVE',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    url: 'https://raw.githubusercontent.com/doctor-8trange/quarnex/refs/heads/main/data/zee5.m3u',
    service: 'zee5',
    serverId: 'server1',
  },
  {
    id: 'zee_def_3',
    title: '&pictures HD',
    category: 'Cinema',
    sport: 'Movies',
    status: 'LIVE',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    url: 'https://raw.githubusercontent.com/doctor-8trange/quarnex/refs/heads/main/data/zee5.m3u',
    service: 'zee5',
    serverId: 'server1',
  },
  {
    id: 'zee_def_4',
    title: 'Zee News Live 24x7',
    category: 'News',
    sport: 'News',
    status: 'LIVE',
    logo: 'https://ik.imagekit.io/7henexusempire/nexusprime.png',
    url: 'https://raw.githubusercontent.com/doctor-8trange/quarnex/refs/heads/main/data/zee5.m3u',
    service: 'zee5',
    serverId: 'server1',
  },
];

export class EventsService {
  private events: Record<'fancode' | 'sonyliv' | 'zee5', SportsEventItem[]> = {
    fancode: [...DEFAULT_FANCODE_EVENTS],
    sonyliv: [...DEFAULT_SONY_EVENTS],
    zee5: [...DEFAULT_ZEE_EVENTS],
  };

  private m3uContent: Record<'fancode' | 'sonyliv' | 'zee5', string> = {
    fancode: '',
    sonyliv: '',
    zee5: '',
  };

  private lastFetchTime: Record<'fancode' | 'sonyliv' | 'zee5', string | null> = {
    fancode: new Date().toISOString(),
    sonyliv: new Date().toISOString(),
    zee5: new Date().toISOString(),
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

    // Initial background fetch (does not block startup)
    setTimeout(() => {
      this.syncAll().catch((err) => console.error('[EventsService] Initial fetch error:', err));
    }, 1500);
  }

  private async fetchRawUrl(url: string, isJson = false): Promise<any> {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: '*/*',
      },
      signal: AbortSignal.timeout(6000), // Fast 6s timeout so UI never hangs
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

    const results = await Promise.allSettled([
      this.fetchRawUrl(jsonUrl, true),
      this.fetchRawUrl(m3uUrl, false),
    ]);

    if (results[0].status === 'fulfilled') {
      jsonData = results[0].value;
    }
    if (results[1].status === 'fulfilled') {
      m3uText = results[1].value;
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

    const tasks: Promise<SportsEventItem[]>[] = [
      this.fetchSingleServerEvents(service, 'server1', config.primaryJson, config.primaryM3u),
    ];

    if (config.backupJson && config.backupM3u) {
      tasks.push(
        this.fetchSingleServerEvents(service, 'server2', config.backupJson, config.backupM3u)
      );
    }

    const settled = await Promise.allSettled(tasks);
    let combined: SportsEventItem[] = [];

    for (const res of settled) {
      if (res.status === 'fulfilled' && res.value.length > 0) {
        combined = [...combined, ...res.value];
      }
    }

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
    if (updates.url !== undefined) {
      this.overrides[id].customUrl = updates.url.replace(/:8443/g, '').replace(/:3000/g, '');
    }
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
      url: (event.url || '').replace(/:8443/g, '').replace(/:3000/g, ''),
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
      const cleanUrl = item.url.replace(/:8443/g, '').replace(/:3000/g, '');

      lines.push(
        `#EXTINF:-1 tvg-id="${item.id}" tvg-name="${cleanTitle}" tvg-logo="${cleanLogo}" group-title="${cleanGroup}",${cleanTitle}`
      );
      lines.push(cleanUrl);
    }

    return lines.join('\n');
  }
}

export const eventsService = new EventsService();

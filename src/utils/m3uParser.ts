import { ChannelStream } from '../types/playlist';

/**
 * Parses pipe-separated headers from URL string:
 * e.g. "https://example.com/live.m3u8|User-Agent=...&Referer=..."
 */
function extractPipeHeaders(rawUrl: string): { cleanUrl: string; headers: Record<string, string> } {
  const pipeIdx = rawUrl.indexOf('|');
  if (pipeIdx === -1) {
    return { cleanUrl: rawUrl, headers: {} };
  }

  const cleanUrl = rawUrl.substring(0, pipeIdx).trim();
  const headerPart = rawUrl.substring(pipeIdx + 1).trim();
  const headers: Record<string, string> = {};

  const pairs = headerPart.split('&');
  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx !== -1) {
      const key = pair.substring(0, eqIdx).trim();
      const val = pair.substring(eqIdx + 1).trim();
      headers[key] = val;
    }
  }

  return { cleanUrl, headers };
}

/**
 * Parses raw M3U / M3U8 playlist text into an array of ChannelStream objects.
 */
export function parseM3U(
  content: string,
  sourceId: string,
  sourceName: string
): ChannelStream[] {
  if (!content || typeof content !== 'string') return [];

  const lines = content.split(/\r?\n/);
  const channels: ChannelStream[] = [];

  let currentTitle = '';
  let currentGroup = 'General';
  let currentLogo = '';
  let currentTvgId = '';
  let currentTvgName = '';
  let currentHeaders: Record<string, string> = {};

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    if (rawLine.startsWith('#EXTINF:')) {
      // Reset stream metadata
      currentHeaders = {};

      // Extract attributes
      const groupMatch = rawLine.match(/group-title="([^"]*)"/i);
      const logoMatch = rawLine.match(/tvg-logo="([^"]*)"/i);
      const idMatch = rawLine.match(/tvg-id="([^"]*)"/i);
      const nameMatch = rawLine.match(/tvg-name="([^"]*)"/i);

      currentGroup = groupMatch ? groupMatch[1].trim() : 'General';
      currentLogo = logoMatch ? logoMatch[1].trim() : '';
      currentTvgId = idMatch ? idMatch[1].trim() : '';
      currentTvgName = nameMatch ? nameMatch[1].trim() : '';

      // Title is usually after the last comma
      const commaIdx = rawLine.lastIndexOf(',');
      if (commaIdx !== -1) {
        currentTitle = rawLine.substring(commaIdx + 1).trim();
      } else {
        currentTitle = currentTvgName || 'Channel ' + (channels.length + 1);
      }
    } else if (rawLine.startsWith('#EXTVLCOPT:http-user-agent=')) {
      currentHeaders['User-Agent'] = rawLine.replace('#EXTVLCOPT:http-user-agent=', '').trim();
    } else if (rawLine.startsWith('#EXTVLCOPT:http-referrer=')) {
      currentHeaders['Referer'] = rawLine.replace('#EXTVLCOPT:http-referrer=', '').trim();
    } else if (rawLine.startsWith('#EXTHTTP:')) {
      try {
        const jsonStr = rawLine.replace('#EXTHTTP:', '').trim();
        const parsed = JSON.parse(jsonStr);
        currentHeaders = { ...currentHeaders, ...parsed };
      } catch {
        // ignore malformed custom header
      }
    } else if (!rawLine.startsWith('#')) {
      // This is the stream URL or streambox:// protocol URL
      const { cleanUrl, headers: pipeHeaders } = extractPipeHeaders(rawLine);
      const mergedHeaders = { ...currentHeaders, ...pipeHeaders };

      // Extract server signature for deduplication
      let serverSignature = 'unknown';
      try {
        if (cleanUrl.startsWith('streambox://')) {
          serverSignature = 'streambox';
        } else {
          const parsedUrl = new URL(cleanUrl);
          serverSignature = parsedUrl.hostname;
        }
      } catch {
        serverSignature = cleanUrl.slice(0, 30);
      }

      // Generate a unique id
      const uniqueId = `${sourceId}-${channels.length + 1}-${Math.random().toString(36).substring(2, 7)}`;

      channels.push({
        id: uniqueId,
        title: currentTitle || `Stream ${channels.length + 1}`,
        url: cleanUrl,
        logo: currentLogo || undefined,
        group: currentGroup || 'General',
        tvgId: currentTvgId || undefined,
        tvgName: currentTvgName || currentTitle,
        sourceId,
        sourceName,
        headers: Object.keys(mergedHeaders).length > 0 ? mergedHeaders : undefined,
        status: 'active',
        serverSignature,
        addedAt: Date.now(),
      });

      // Clear current state
      currentTitle = '';
      currentLogo = '';
      currentTvgId = '';
      currentTvgName = '';
      currentGroup = 'General';
      currentHeaders = {};
    }
  }

  return channels;
}

/**
 * Parses JSON event formats (like Fancode and SonyLIV live events json)
 */
export function parseEventJSON(
  data: any,
  sourceId: string,
  sourceName: string
): ChannelStream[] {
  if (!data) return [];
  const channels: ChannelStream[] = [];

  // Helper to extract events from various array properties
  let items: any[] = [];
  if (Array.isArray(data)) {
    items = data;
  } else if (data.matches && Array.isArray(data.matches)) {
    items = data.matches;
  } else if (data.events && Array.isArray(data.events)) {
    items = data.events;
  } else if (data.channels && Array.isArray(data.channels)) {
    items = data.channels;
  } else if (data.data && Array.isArray(data.data) && data.data.length > 0) {
    items = data.data;
  } else if (data.upcoming && Array.isArray(data.upcoming)) {
    items = data.upcoming;
  }

  items.forEach((item, index) => {
    // Determine title
    let title =
      item.match_name ||
      item.event_name ||
      item.title ||
      item.name ||
      item.channel_name ||
      item.video_info?.title ||
      `Live Event ${index + 1}`;

    if (item.status && item.status !== 'LIVE' && !title.includes(item.status)) {
      title = `[${item.status}] ${title}`;
    }

    // Determine stream url
    let streamUrl =
      item.Primary_Playback_URL ||
      item.fancode_cdn ||
      item.stream_link ||
      item.stream_url ||
      item.url ||
      item.adfree_url ||
      item.dai_url ||
      item.playback_url ||
      item.hls_url ||
      item.stream_info?.adfree_url ||
      item.stream_info?.dai_url ||
      '';

    // If stream URL is still empty and auto_streams has an embedded m3u8 url
    if (!streamUrl && item.auto_streams && Array.isArray(item.auto_streams) && item.auto_streams[0]?.auto) {
      const match = item.auto_streams[0].auto.match(/https?:\/\/[^\s\n]+\.m3u8[^\s\n]*/);
      if (match) {
        streamUrl = match[0];
      }
    }

    // Determine category / group
    const group =
      item.tour_name ||
      item.tournament ||
      item.category ||
      item.sport ||
      item.video_info?.genres?.[0] ||
      sourceName ||
      'Live Events';

    // Determine logo / poster
    const logo =
      item.image ||
      item.image_cdn?.APP ||
      item.image_cdn?.BG_IMAGE ||
      item.image_cdn?.CLOUDFARE ||
      item.src ||
      item.poster ||
      item.logo ||
      item.banner ||
      item.image_url ||
      '';

    const tvgId = item.id || item.match_id || item.contentId ? String(item.id || item.match_id || item.contentId) : `event-${index + 1}`;

    let serverSignature = 'events';
    if (streamUrl) {
      try {
        serverSignature = new URL(streamUrl).hostname;
      } catch {
        serverSignature = 'events';
      }
    }

    const headers: Record<string, string> = {};
    if (data.headers?.['User-Agent']) headers['User-Agent'] = data.headers['User-Agent'];
    if (data.headers?.['Referer']) headers['Referer'] = data.headers['Referer'];

    channels.push({
      id: `${sourceId}-${index + 1}-${Math.random().toString(36).substring(2, 7)}`,
      title: String(title),
      url: streamUrl ? String(streamUrl) : `event://${tvgId}`,
      logo: logo ? String(logo) : undefined,
      group: String(group),
      tvgId,
      tvgName: String(title),
      sourceId,
      sourceName,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      status: 'active',
      serverSignature,
      addedAt: Date.now(),
    });
  });

  return channels;
}

/**
 * Builds an M3U / M3U8 formatted string from channels.
 */
export function buildM3U(channels: ChannelStream[], playlistName = 'Nexus Empire Playlist'): string {
  const lines: string[] = [
    `#EXTM3U x-tvg-url="" url-tvg="" name="${playlistName}"`
  ];

  for (const ch of channels) {
    if (ch.status === 'trashed') continue;

    const tvgIdAttr = ch.tvgId ? ` tvg-id="${escapeM3UAttr(ch.tvgId)}"` : '';
    const tvgNameAttr = ch.tvgName ? ` tvg-name="${escapeM3UAttr(ch.tvgName)}"` : ` tvg-name="${escapeM3UAttr(ch.title)}"`;
    const tvgLogoAttr = ch.logo ? ` tvg-logo="${escapeM3UAttr(ch.logo)}"` : '';
    const groupAttr = ch.group ? ` group-title="${escapeM3UAttr(ch.group)}"` : ' group-title="General"';

    lines.push(`#EXTINF:-1${tvgIdAttr}${tvgNameAttr}${tvgLogoAttr}${groupAttr},${ch.title}`);

    // If headers exist, add standard headers for VLC / Kodi / TiviMate
    if (ch.headers) {
      if (ch.headers['User-Agent']) {
        lines.push(`#EXTVLCOPT:http-user-agent=${ch.headers['User-Agent']}`);
      }
      if (ch.headers['Referer']) {
        lines.push(`#EXTVLCOPT:http-referrer=${ch.headers['Referer']}`);
      }
      lines.push(`#EXTHTTP:${JSON.stringify(ch.headers)}`);

      // Format pipe parameter for players that parse URL|User-Agent=...
      const pipeParams = Object.entries(ch.headers)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      lines.push(`${ch.url}|${pipeParams}`);
    } else {
      lines.push(ch.url);
    }
  }

  return lines.join('\n') + '\n';
}

function escapeM3UAttr(str: string): string {
  return str.replace(/"/g, "'");
}

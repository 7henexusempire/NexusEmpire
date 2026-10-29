import { ChannelStream, DuplicateCluster } from '../types/playlist';

/**
 * Normalizes channel title for semantic matching:
 * - strips quality tags (HD, FHD, 4K, 720p, 1080p, SD, HEVC, 50FPS)
 * - strips country/bracket prefixes ([IN], (UK), |US|, etc.)
 * - normalizes whitespace, symbols, lowercase
 */
export function normalizeChannelName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\[.*?\]|\(.*?\)|\|.*?\|/g, '') // remove brackets [US], (HD)
    .replace(/\b(fhd|hd|4k|uhd|sd|hevc|50fps|60fps|raw|vip|live|backup|server\s*\d+)\b/gi, '')
    .replace(/[^\w\s]/gi, ' ') // symbols to spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts normalized origin / server identity from a URL.
 */
export function extractServerOrigin(url: string): { host: string; pathSignature: string } {
  try {
    if (url.startsWith('streambox://')) {
      const parts = url.replace('streambox://open/', '').split('?');
      return { host: 'streambox.internal', pathSignature: parts[0] };
    }
    const parsed = new URL(url);
    // path without query strings or trailing hash
    const cleanPath = parsed.pathname.replace(/\/+$/, '');
    return {
      host: parsed.hostname.toLowerCase(),
      pathSignature: cleanPath,
    };
  } catch {
    return { host: 'unknown', pathSignature: url.slice(0, 40) };
  }
}

/**
 * Smart channel deduplication logic:
 * Checks whether channels with the same or near-identical name are:
 * 1. Exact Duplicate: Same server origin AND same stream path/token.
 * 2. Redundant Duplicate: Same server origin, identical or mirror stream.
 * 3. Alternate Server Mirror: Same channel name BUT DIFFERENT server/host/CDN origin! -> DO NOT auto-trash, KEEP IT!
 */
export function detectDuplicates(channels: ChannelStream[]): {
  clusters: DuplicateCluster[];
  summary: {
    totalChecked: number;
    duplicateCount: number;
    alternateServerCount: number;
  };
} {
  const activeChannels = channels.filter((c) => c.status !== 'trashed');
  const normalizedMap = new Map<string, ChannelStream[]>();

  // Group channels by normalized name
  for (const ch of activeChannels) {
    const norm = normalizeChannelName(ch.title);
    if (!norm || norm.length < 2) continue;

    const list = normalizedMap.get(norm) || [];
    list.push(ch);
    normalizedMap.set(norm, list);
  }

  const clusters: DuplicateCluster[] = [];
  let totalDuplicates = 0;
  let totalAlternateServers = 0;

  let clusterIndex = 1;
  for (const [normName, groupChannels] of normalizedMap.entries()) {
    if (groupChannels.length <= 1) continue;

    // We have multiple channels with the same normalized name.
    // Group them by server origin.
    const serverMap = new Map<string, ChannelStream[]>();
    for (const ch of groupChannels) {
      const origin = extractServerOrigin(ch.url);
      const serverKey = origin.host;
      const list = serverMap.get(serverKey) || [];
      list.push(ch);
      serverMap.set(serverKey, list);
    }

    // If there are multiple distinct servers, note that alternate servers are preserved!
    if (serverMap.size > 1) {
      totalAlternateServers += serverMap.size - 1;
    }

    // Now look inside each server group for true duplicates
    for (const [serverHost, sameServerList] of serverMap.entries()) {
      if (sameServerList.length > 1) {
        // True duplicate on the SAME server/host!
        const primary = sameServerList[0];
        const duplicates = sameServerList.slice(1);
        const dupIds = duplicates.map((d) => d.id);

        totalDuplicates += duplicates.length;

        clusters.push({
          clusterId: `cluster-${clusterIndex++}`,
          canonicalId: primary.id,
          channelName: primary.title,
          reason: `Identical server feed detected on [${serverHost}]. Redundant stream with same origin.`,
          isSameServer: true,
          duplicateIds: dupIds,
        });
      }
    }
  }

  return {
    clusters,
    summary: {
      totalChecked: activeChannels.length,
      duplicateCount: totalDuplicates,
      alternateServerCount: totalAlternateServers,
    },
  };
}

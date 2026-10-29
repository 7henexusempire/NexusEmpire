import { ChannelItem } from '../types';

export interface DeduplicationOptions {
  mode: 'smart' | 'strict' | 'url_only' | 'off';
  disambiguateNames?: boolean;
  restoredChannelIds?: Set<string>;
}

export interface DuplicateReportItem {
  id: string;
  name: string;
  originalName: string;
  group: string;
  sourceId: string;
  sourceName?: string;
  url: string;
  normalizedUrl: string;
  clearKeySnippet?: string;
  reason: string;
  primaryChannelId?: string;
  primaryChannelName?: string;
  primaryChannelUrl?: string;
  primaryChannelSource?: string;
  primaryChannelGroup?: string;
  isRestored?: boolean;
}

export interface DeduplicationResult {
  channels: ChannelItem[];
  duplicates: DuplicateReportItem[];
  stats: {
    totalRaw: number;
    exactDuplicatesRemoved: number;
    distinctVariantsPreserved: number;
    restoredCount: number;
    finalCleanChannels: number;
  };
}

/**
 * Normalizes a stream URL for comparison by stripping transient session tokens,
 * expires, auth queries, while preserving the core manifest path and parameters.
 */
export function normalizeStreamUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const clean = rawUrl.trim();

  // If streambox deep-link, return as-is
  if (clean.startsWith('streambox://')) return clean.toLowerCase();

  try {
    // Handle pipe directives in URL (e.g. url|User-Agent=...)
    const pipeIdx = clean.indexOf('|');
    const mainUrl = pipeIdx !== -1 ? clean.substring(0, pipeIdx) : clean;
    const pipeDirectives = pipeIdx !== -1 ? clean.substring(pipeIdx).toLowerCase() : '';

    const parsed = new URL(mainUrl);
    // Remove transient query params that change per request
    const paramsToRemove = [
      'token', 'hdntl', 'exp', 'auth', 'session', 't', 'timestamp',
      'signature', 'sig', 'hmac', 'uuid', '_t', 'random'
    ];
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (paramsToRemove.includes(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }

    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname.toLowerCase()}${parsed.search ? '?' + parsed.searchParams.toString() : ''}${pipeDirectives}`;
  } catch {
    // Fallback if not standard URL
    return clean.toLowerCase().replace(/[?&](token|exp|session|auth|hmac)=[^&]*/gi, '');
  }
}

/**
 * Normalizes a channel name to detect matching channels
 */
export function normalizeChannelName(rawName: string): string {
  if (!rawName) return '';
  return rawName
    .toLowerCase()
    .replace(/\[stream\s*\d+\]/gi, '')
    .replace(/\s*\(fhd\)/gi, '')
    .replace(/\s*\(hd\)/gi, '')
    .replace(/\s*\(sd\)/gi, '')
    .replace(/\s*\(4k\)/gi, '')
    .replace(/\s*\[.*?\]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Intelligent Stream Deduplicator
 * - Removes 100% duplicate stream URLs / keys.
 * - Records detailed duplicate reports including source category and primary stream references.
 * - Exempts user-restored channels.
 */
export function deduplicateChannelList(
  channels: ChannelItem[],
  options: DeduplicationOptions = { mode: 'smart', disambiguateNames: true }
): DeduplicationResult {
  const { mode = 'smart', disambiguateNames = true, restoredChannelIds = new Set() } = options;

  if (mode === 'off' || channels.length === 0) {
    return {
      channels,
      duplicates: [],
      stats: {
        totalRaw: channels.length,
        exactDuplicatesRemoved: 0,
        distinctVariantsPreserved: 0,
        restoredCount: 0,
        finalCleanChannels: channels.length,
      },
    };
  }

  const seenStreamMap = new Map<string, ChannelItem>();
  const nameToStreamsMap = new Map<string, ChannelItem[]>();
  const result: ChannelItem[] = [];
  const duplicates: DuplicateReportItem[] = [];

  let exactDuplicatesRemoved = 0;
  let distinctVariantsPreserved = 0;
  let restoredCount = 0;

  for (const ch of channels) {
    const rawUrl = ch.customUrl || ch.url || '';
    const normUrl = normalizeStreamUrl(rawUrl);
    const keySig = ch.clearKeySnippet ? ch.clearKeySnippet.trim() : '';
    const streamIdentifier = `${normUrl}::${keySig}`;
    const displayName = ch.customName || ch.name;
    const groupName = ch.customGroup || ch.groupTitle || ch.category || 'General';

    // If channel has been restored by user, force include it
    if (restoredChannelIds.has(ch.id)) {
      restoredCount++;
      result.push(ch);
      continue;
    }

    // 1. Check for exact duplicate stream URL/key
    if (seenStreamMap.has(streamIdentifier)) {
      exactDuplicatesRemoved++;
      const primary = seenStreamMap.get(streamIdentifier)!;
      duplicates.push({
        id: ch.id,
        name: displayName,
        originalName: ch.name,
        group: groupName,
        sourceId: ch.sourceId || 'unknown',
        sourceName: ch.sourceName || ch.sourceId || 'Source',
        url: rawUrl,
        normalizedUrl: normUrl,
        clearKeySnippet: keySig,
        reason: 'Exact Stream URL & Key Collision',
        primaryChannelId: primary.id,
        primaryChannelName: primary.customName || primary.name,
        primaryChannelUrl: primary.customUrl || primary.url,
        primaryChannelSource: primary.sourceName || primary.sourceId,
        primaryChannelGroup: primary.customGroup || primary.groupTitle,
        isRestored: false,
      });
      continue;
    }
    seenStreamMap.set(streamIdentifier, ch);

    // 2. Check channel name collision
    const normName = normalizeChannelName(displayName);

    if (mode === 'strict') {
      if (normName && nameToStreamsMap.has(normName)) {
        exactDuplicatesRemoved++;
        const primary = nameToStreamsMap.get(normName)![0];
        duplicates.push({
          id: ch.id,
          name: displayName,
          originalName: ch.name,
          group: groupName,
          sourceId: ch.sourceId || 'unknown',
          sourceName: ch.sourceName || ch.sourceId || 'Source',
          url: rawUrl,
          normalizedUrl: normUrl,
          clearKeySnippet: keySig,
          reason: 'Strict Title Collision',
          primaryChannelId: primary.id,
          primaryChannelName: primary.customName || primary.name,
          primaryChannelUrl: primary.customUrl || primary.url,
          primaryChannelSource: primary.sourceName || primary.sourceId,
          primaryChannelGroup: primary.customGroup || primary.groupTitle,
          isRestored: false,
        });
        continue;
      }
      nameToStreamsMap.set(normName, [ch]);
      result.push(ch);
    } else if (mode === 'url_only') {
      result.push(ch);
    } else {
      // Smart mode (default)
      if (!nameToStreamsMap.has(normName)) {
        nameToStreamsMap.set(normName, [ch]);
        result.push(ch);
      } else {
        const existingList = nameToStreamsMap.get(normName)!;
        const primary = existingList[0];
        const isDistinctStream = !existingList.some((existing) => {
          const exNorm = normalizeStreamUrl(existing.customUrl || existing.url);
          const exKey = existing.clearKeySnippet ? existing.clearKeySnippet.trim() : '';
          return exNorm === normUrl && exKey === keySig;
        });

        if (isDistinctStream) {
          existingList.push(ch);
          distinctVariantsPreserved++;
          result.push(ch);
        } else {
          exactDuplicatesRemoved++;
          duplicates.push({
            id: ch.id,
            name: displayName,
            originalName: ch.name,
            group: groupName,
            sourceId: ch.sourceId || 'unknown',
            sourceName: ch.sourceName || ch.sourceId || 'Source',
            url: rawUrl,
            normalizedUrl: normUrl,
            clearKeySnippet: keySig,
            reason: 'Identical Stream Feed Variant',
            primaryChannelId: primary.id,
            primaryChannelName: primary.customName || primary.name,
            primaryChannelUrl: primary.customUrl || primary.url,
            primaryChannelSource: primary.sourceName || primary.sourceId,
            primaryChannelGroup: primary.customGroup || primary.groupTitle,
            isRestored: false,
          });
        }
      }
    }
  }

  // 3. Post-process stream variant numbering
  if (disambiguateNames && mode === 'smart') {
    for (const [_, variants] of nameToStreamsMap.entries()) {
      if (variants.length > 1) {
        variants.forEach((v, index) => {
          v.streamVariant = index + 1;
        });
      }
    }
  }

  return {
    channels: result,
    duplicates,
    stats: {
      totalRaw: channels.length,
      exactDuplicatesRemoved,
      distinctVariantsPreserved,
      restoredCount,
      finalCleanChannels: result.length,
    },
  };
}

/**
 * AI Fuzzy String Matcher to detect subtle duplicate titles
 */
export function aiFindFuzzyDuplicates(channels: ChannelItem[], threshold = 0.85): DuplicateReportItem[] {
  const fuzzyDuplicates: DuplicateReportItem[] = [];
  const cleanChannels = channels.map((c) => ({
    ...c,
    normName: normalizeChannelName(c.customName || c.name),
  }));

  for (let i = 0; i < cleanChannels.length; i++) {
    for (let j = i + 1; j < cleanChannels.length; j++) {
      const a = cleanChannels[i];
      const b = cleanChannels[j];

      if (!a.normName || !b.normName) continue;
      if (a.normName === b.normName) continue; // Already caught by standard dedup

      // Calculate Dice / Jaccard token similarity
      const tokensA = new Set(a.normName.split(''));
      const tokensB = new Set(b.normName.split(''));
      const intersection = new Set([...tokensA].filter((x) => tokensB.has(x)));
      const similarity = (2 * intersection.size) / (tokensA.size + tokensB.size);

      if (similarity >= threshold) {
        fuzzyDuplicates.push({
          id: b.id,
          name: b.customName || b.name,
          originalName: b.name,
          group: b.customGroup || b.groupTitle || 'General',
          sourceId: b.sourceId || 'unknown',
          sourceName: b.sourceName || b.sourceId,
          url: b.customUrl || b.url,
          normalizedUrl: normalizeStreamUrl(b.customUrl || b.url),
          reason: `AI Fuzzy Match (${Math.round(similarity * 100)}% similarity)`,
          primaryChannelId: a.id,
          primaryChannelName: a.customName || a.name,
          primaryChannelUrl: a.customUrl || a.url,
          primaryChannelSource: a.sourceName || a.sourceId,
          primaryChannelGroup: a.customGroup || a.groupTitle,
          isRestored: false,
        });
      }
    }
  }

  return fuzzyDuplicates;
}


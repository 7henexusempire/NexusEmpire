/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChannelItem } from '../types';

export interface DeduplicationOptions {
  mode: 'smart' | 'strict' | 'url_only' | 'off';
  disambiguateNames?: boolean;
}

export interface DeduplicationResult {
  channels: ChannelItem[];
  stats: {
    totalRaw: number;
    exactDuplicatesRemoved: number;
    distinctVariantsPreserved: number;
    finalCleanChannels: number;
  };
}

export function normalizeStreamUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const clean = rawUrl.trim();
  if (clean.startsWith('streambox://')) return clean.toLowerCase();
  
  try {
    const pipeIdx = clean.indexOf('|');
    const mainUrl = pipeIdx !== -1 ? clean.substring(0, pipeIdx) : clean;
    const pipeDirectives = pipeIdx !== -1 ? clean.substring(pipeIdx).toLowerCase() : '';
    const parsed = new URL(mainUrl);
    
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
    return clean.toLowerCase().replace(/[?&](token|exp|session|auth|hmac)=[^&]*/gi, '');
  }
}

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

export function deduplicateChannelList(
  channels: ChannelItem[],
  options: DeduplicationOptions = { mode: 'smart', disambiguateNames: true }
): DeduplicationResult {
  const { mode = 'smart', disambiguateNames = true } = options;
  if (mode === 'off' || channels.length === 0) {
    return {
      channels,
      stats: {
        totalRaw: channels.length,
        exactDuplicatesRemoved: 0,
        distinctVariantsPreserved: 0,
        finalCleanChannels: channels.length,
      },
    };
  }

  const seenStreamKeys = new Set<string>();
  const nameToStreamsMap = new Map<string, ChannelItem[]>();
  const result: ChannelItem[] = [];
  let exactDuplicatesRemoved = 0;
  let distinctVariantsPreserved = 0;

  for (const ch of channels) {
    const rawUrl = ch.customUrl || ch.url || '';
    const normUrl = normalizeStreamUrl(rawUrl);
    const keySig = ch.clearKeySnippet ? ch.clearKeySnippet.trim() : '';
    const streamIdentifier = `${normUrl}::${keySig}`;

    if (seenStreamKeys.has(streamIdentifier)) {
      exactDuplicatesRemoved++;
      continue;
    }
    seenStreamKeys.add(streamIdentifier);

    const displayName = ch.customName || ch.name;
    const normName = normalizeChannelName(displayName);

    if (mode === 'strict') {
      if (normName && nameToStreamsMap.has(normName)) {
        exactDuplicatesRemoved++;
        continue;
      }
      nameToStreamsMap.set(normName, [ch]);
      result.push(ch);
    } else if (mode === 'url_only') {
      result.push(ch);
    } else {
      if (!nameToStreamsMap.has(normName)) {
        nameToStreamsMap.set(normName, [ch]);
        result.push(ch);
      } else {
        const existingList = nameToStreamsMap.get(normName)!;
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
        }
      }
    }
  }

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
    stats: {
      totalRaw: channels.length,
      exactDuplicatesRemoved,
      distinctVariantsPreserved,
      finalCleanChannels: result.length,
    },
  };
}

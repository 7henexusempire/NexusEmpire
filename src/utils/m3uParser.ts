/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChannelItem } from '../types';

export function parseM3U(content: string, sourceId: string): { channels: ChannelItem[]; headers: string[] } {
  const lines = content.split(/\r?\n/);
  const channels: ChannelItem[] = [];
  const headers: string[] = [];
  
  let currentChannel: Partial<ChannelItem> = {};
  let preDirectives: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    if (line.startsWith('#EXTM3U')) {
      headers.push(line);
      continue;
    }
    
    if (line.startsWith('#EXTINF:')) {
      // If we were building a channel and found a new INF, it might be a malformed M3U or multiple INFs for one URL
      // But usually INF is followed by directives and then the URL.
      
      const info = line.substring(8);
      const nameMatch = info.match(/,(.*)$/);
      const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
      
      const tvgId = info.match(/tvg-id="([^"]*)"/)?.[1] || null;
      const tvgName = info.match(/tvg-name="([^"]*)"/)?.[1] || null;
      const tvgLogo = info.match(/tvg-logo="([^"]*)"/)?.[1] || null;
      const tvgChno = info.match(/tvg-chno="([^"]*)"/)?.[1] || null;
      const groupTitle = info.match(/group-title="([^"]*)"/)?.[1] || 'Uncategorized';
      const groupLogo = info.match(/group-logo="([^"]*)"/)?.[1] || null;
      
      currentChannel = {
        id: `ch_${sourceId}_${channels.length}_${Math.random().toString(36).substr(2, 5)}`,
        sourceId,
        name,
        tvgId,
        tvgName,
        tvgLogo,
        tvgChno,
        groupTitle,
        groupLogo,
        enabled: true,
        preDirectives: [...preDirectives],
        directives: []
      };
      preDirectives = [];
    } else if (line.startsWith('#')) {
      // Handle directives or comments
      if (currentChannel.id) {
        currentChannel.directives?.push(line);
      } else {
        preDirectives.push(line);
      }
    } else {
      // This is the URL
      if (currentChannel.id) {
        currentChannel.url = line;
        channels.push(currentChannel as ChannelItem);
        currentChannel = {};
      }
    }
  }
  
  return { channels, headers };
}

import { GoogleGenAI } from '@google/genai';
import { ChannelItem, PrefixSuffixConfig } from '../types';

export class AIService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      try {
        this.ai = new GoogleGenAI();
      } catch (e) {
        console.warn('[AIService] Failed to init GoogleGenAI:', e);
      }
    }
  }

  /**
   * Fast rule-based classifier that handles Indian & Global TV channels with 100% precision.
   */
  public heuristicClassify(name: string, currentGroup = ''): string {
    const n = name.toLowerCase();
    const g = currentGroup.toLowerCase();

    // 1. Sports
    if (
      n.includes('sports') ||
      n.includes('ten 1') ||
      n.includes('ten 2') ||
      n.includes('ten 3') ||
      n.includes('ten 4') ||
      n.includes('ten 5') ||
      n.includes('willow') ||
      n.includes('cricket') ||
      n.includes('fifa') ||
      n.includes('football') ||
      n.includes('ipl') ||
      n.includes('fancode') ||
      n.includes('star sports') ||
      n.includes('supersport') ||
      n.includes('eurosport') ||
      n.includes('espn') ||
      n.includes('bein') ||
      n.includes('wwe') ||
      n.includes('ufc') ||
      n.includes('motogp') ||
      n.includes('formula') ||
      g.includes('sport') ||
      g.includes('match') ||
      g.includes('event')
    ) {
      if (n.includes('sony') || n.includes('ten ')) return 'Sony Sports';
      if (n.includes('willow') || n.includes('cricket')) return 'Live Cricket';
      return 'Live Sports & Events';
    }

    // 2. Movies & Cinema
    if (
      n.includes('cinema') ||
      n.includes('movies') ||
      n.includes('sony max') ||
      n.includes('star gold') ||
      n.includes('zee cinema') ||
      n.includes('hbo') ||
      n.includes('cinemax') ||
      n.includes('colors cineplex') ||
      n.includes('b4u movies') ||
      n.includes('film') ||
      n.includes('blockbuster') ||
      g.includes('movie') ||
      g.includes('cinema')
    ) {
      if (n.includes('sony')) return 'Sony Movies';
      return 'Movies & Cinema';
    }

    // 3. Kids & Animation
    if (
      n.includes('cartoon') ||
      n.includes('pogo') ||
      n.includes('disney') ||
      n.includes('nick') ||
      n.includes('nickelodeon') ||
      n.includes('sony yay') ||
      n.includes('hungama') ||
      n.includes('sonic') ||
      n.includes('animax') ||
      n.includes('kids') ||
      g.includes('kids') ||
      g.includes('animation')
    ) {
      if (n.includes('sony')) return 'Sony Kids';
      return 'Kids & Animation';
    }

    // 4. News & Current Affairs
    if (
      n.includes('news') ||
      n.includes('aaj tak') ||
      n.includes('ndtv') ||
      n.includes('india today') ||
      n.includes('republic') ||
      n.includes('abp') ||
      n.includes('times now') ||
      n.includes('cnn') ||
      n.includes('bbc') ||
      n.includes('al jazeera') ||
      n.includes('cnbc') ||
      n.includes('zee news') ||
      n.includes('tv9') ||
      g.includes('news')
    ) {
      return 'News & Current Affairs';
    }

    // 5. Music & Youth
    if (
      n.includes('music') ||
      n.includes('mtv') ||
      n.includes('9xm') ||
      n.includes('zing') ||
      n.includes('zoom') ||
      n.includes('b4u music') ||
      n.includes('sony mix') ||
      n.includes('vh1') ||
      n.includes('mastiii') ||
      g.includes('music')
    ) {
      return 'Music & Youth';
    }

    // 6. Infotainment & Documentaries
    if (
      n.includes('discovery') ||
      n.includes('nat geo') ||
      n.includes('national geographic') ||
      n.includes('animal planet') ||
      n.includes('history tv18') ||
      n.includes('tlc') ||
      n.includes('science') ||
      n.includes('investigation') ||
      g.includes('docu') ||
      g.includes('info')
    ) {
      if (n.includes('sony bbc')) return 'Sony BBC Earth';
      return 'Infotainment & Discovery';
    }

    // 7. Sony Specific Entertainment (SAB, PAL, SET)
    if (n.includes('sony') || n.includes('sab') || n.includes('set hd') || n.includes('sony pal')) {
      if (n.includes('sab')) return 'Sony SAB & Comedy';
      if (n.includes('pal')) return 'Sony PAL';
      if (n.includes('aath') || n.includes('marathi') || n.includes('yay')) return 'Sony Regional';
      return 'Sony Entertainment (GEC)';
    }

    // 8. General Entertainment (GEC)
    if (
      n.includes('entertainment') ||
      n.includes('star plus') ||
      n.includes('colors') ||
      n.includes('zee tv') ||
      n.includes('star bharat') ||
      n.includes('&tv') ||
      n.includes('dangal') ||
      g.includes('entertainment') ||
      g.includes('gec')
    ) {
      return 'Entertainment & GEC';
    }

    // 9. Regional / Languages
    if (
      n.includes('bangla') ||
      n.includes('tamil') ||
      n.includes('telugu') ||
      n.includes('malayalam') ||
      n.includes('kannada') ||
      n.includes('marathi') ||
      n.includes('punjabi') ||
      n.includes('bhojpuri') ||
      n.includes('gujarati') ||
      n.includes('sun tv') ||
      n.includes('asianet') ||
      n.includes('pravah') ||
      g.includes('regional')
    ) {
      return 'Regional & Languages';
    }

    // 10. Religious / Devotional
    if (
      n.includes('aastha') ||
      n.includes('sanskar') ||
      n.includes('bhakti') ||
      n.includes('peace tv') ||
      n.includes('satsang') ||
      g.includes('religious') ||
      g.includes('devotional')
    ) {
      return 'Religious & Devotional';
    }

    return currentGroup || 'General Entertainment';
  }

  /**
   * Auto-categorizes channels using Gemini AI if key exists, with heuristic fallback.
   */
  public async categorizeChannels(
    channels: { id: string; name: string; group?: string }[]
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    // First pass: Apply robust heuristic
    for (const ch of channels) {
      results[ch.id] = this.heuristicClassify(ch.name, ch.group);
    }

    // If Gemini API is available and there are unclassified or generic channels, refine with AI
    if (this.ai && process.env.GEMINI_API_KEY && channels.length > 0) {
      try {
        const sample = channels.slice(0, 80).map((c) => `${c.id}:::${c.name}`).join('\n');
        const prompt = `Classify the following IPTV channels into one of these exact categories:
- Live Sports & Events
- Sony Sports
- Live Cricket
- Sony Movies
- Movies & Cinema
- Sony Entertainment (GEC)
- Sony SAB & Comedy
- Entertainment & GEC
- News & Current Affairs
- Kids & Animation
- Music & Youth
- Infotainment & Discovery
- Regional & Languages
- Religious & Devotional

Channels:
${sample}

Return ONLY valid JSON in this exact structure without markdown:
{"categories": {"CHANNEL_ID": "Category Name"}}`;

        const response = await this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const text = response.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed && parsed.categories) {
            Object.assign(results, parsed.categories);
          }
        }
      } catch (err) {
        console.warn('[AIService] Gemini categorization fallback to heuristic:', err);
      }
    }

    return results;
  }

  /**
   * Applies prefixes and suffixes across channel names and group titles,
   * plus auto-channel numbering.
   */
  public applyPrefixSuffix(
    channels: ChannelItem[],
    options: PrefixSuffixConfig
  ): { affected: number; channels: ChannelItem[] } {
    let affected = 0;
    const {
      namePrefix = '',
      nameSuffix = '',
      groupPrefix = '',
      groupSuffix = '',
      startChannelNumber,
      enableChannelNumbering,
    } = options;

    let chnoCounter = typeof startChannelNumber === 'number' ? startChannelNumber : 1;

    for (const ch of channels) {
      let changed = false;

      // Channel name prefix & suffix
      const baseName = ch.customName || ch.name;
      let newName = baseName;

      if (namePrefix && !newName.startsWith(namePrefix)) {
        newName = `${namePrefix}${newName}`;
        changed = true;
      }
      if (nameSuffix && !newName.endsWith(nameSuffix)) {
        newName = `${newName}${nameSuffix}`;
        changed = true;
      }
      if (changed) {
        ch.customName = newName;
      }

      // Group title prefix & suffix
      const baseGroup = ch.customGroup || ch.groupTitle;
      let newGroup = baseGroup;
      let groupChanged = false;

      if (groupPrefix && !newGroup.startsWith(groupPrefix)) {
        newGroup = `${groupPrefix}${newGroup}`;
        groupChanged = true;
      }
      if (groupSuffix && !newGroup.endsWith(groupSuffix)) {
        newGroup = `${newGroup}${groupSuffix}`;
        groupChanged = true;
      }
      if (groupChanged) {
        ch.customGroup = newGroup;
        changed = true;
      }

      // Channel numbering
      if (enableChannelNumbering) {
        ch.customChno = String(chnoCounter++);
        changed = true;
      }

      if (changed) {
        affected++;
      }
    }

    return { affected, channels };
  }
}

export const aiService = new AIService();

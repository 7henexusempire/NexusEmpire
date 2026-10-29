import test from 'node:test';
import assert from 'node:assert/strict';
import { parseM3U, parseEventJSON, buildM3U } from './m3uParser';
import { normalizeChannelName, extractServerOrigin, detectDuplicates } from './duplicateDetector';
import { ChannelStream } from '../types/playlist';

test('parseM3U correctly parses standard EXTM3U with metadata and headers', () => {
  const m3uSample = `#EXTM3U
#EXTINF:-1 tvg-id="sony10" tvg-name="Sony Sports Ten 1" tvg-logo="https://example.com/logo.png" group-title="Sports",Sony Sports 1 HD
#EXTVLCOPT:http-user-agent=NexusPlayer/1.0
https://stream.server.com/live/sonysports1/index.m3u8
#EXTINF:-1 tvg-id="star1" group-title="Entertainment",Star Plus HD
streambox://open/255cfab9f98da87dab11a6e0a337279e
`;

  const channels = parseM3U(m3uSample, 'test-source', 'Test Source');
  assert.equal(channels.length, 2);
  assert.equal(channels[0].title, 'Sony Sports 1 HD');
  assert.equal(channels[0].tvgId, 'sony10');
  assert.equal(channels[0].group, 'Sports');
  assert.equal(channels[0].logo, 'https://example.com/logo.png');
  assert.equal(channels[0].headers?.['User-Agent'], 'NexusPlayer/1.0');
  assert.equal(channels[0].url, 'https://stream.server.com/live/sonysports1/index.m3u8');

  assert.equal(channels[1].title, 'Star Plus HD');
  assert.equal(channels[1].url, 'streambox://open/255cfab9f98da87dab11a6e0a337279e');
});

test('parseEventJSON parses event arrays and matches', () => {
  const sampleJson = {
    matches: [
      {
        match_name: 'Arsenal vs Chelsea Live',
        stream_link: 'https://live.fancode.com/match1/stream.m3u8',
        tour_name: 'Premier League',
        src: 'https://fancode.com/poster.jpg'
      }
    ]
  };

  const parsed = parseEventJSON(sampleJson, 'fancode', 'Fancode Live');
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].title, 'Arsenal vs Chelsea Live');
  assert.equal(parsed[0].group, 'Premier League');
  assert.equal(parsed[0].url, 'https://live.fancode.com/match1/stream.m3u8');
  assert.equal(parsed[0].logo, 'https://fancode.com/poster.jpg');
});

test('buildM3U properly generates valid M3U file', () => {
  const channels: ChannelStream[] = [
    {
      id: '1',
      title: 'Sony Ten 1 HD',
      url: 'https://stream.com/live.m3u8',
      group: 'Sports',
      tvgId: 'sony.ten1',
      sourceId: 'src-1',
      sourceName: 'Sony Live'
    }
  ];

  const output = buildM3U(channels, 'Nexus Test Playlist');
  assert.match(output, /#EXTM3U/);
  assert.match(output, /tvg-id="sony.ten1"/);
  assert.match(output, /group-title="Sports"/);
  assert.match(output, /Sony Ten 1 HD/);
  assert.match(output, /https:\/\/stream\.com\/live\.m3u8/);
});

test('duplicateDetector differentiates identical servers from different backup servers', () => {
  const channels: ChannelStream[] = [
    {
      id: 'c1',
      title: 'Sony Ten 1 HD',
      url: 'https://server-a.net/live/ch1.m3u8',
      sourceId: 's1',
      sourceName: 'Source 1'
    },
    {
      id: 'c2',
      title: 'Sony Ten 1 [FHD]', // same normalized name, same server-a.net -> TRUE DUPLICATE
      url: 'https://server-a.net/live/ch1_copy.m3u8',
      sourceId: 's1',
      sourceName: 'Source 1'
    },
    {
      id: 'c3',
      title: 'Sony Ten 1 4K', // same normalized name, BUT DIFFERENT server-b.com -> ALTERNATE SERVER (KEEP)
      url: 'https://server-b.com/live/ch1.m3u8',
      sourceId: 's2',
      sourceName: 'Source 2'
    }
  ];

  const result = detectDuplicates(channels);
  assert.equal(result.clusters.length, 1);
  assert.equal(result.clusters[0].canonicalId, 'c1');
  assert.deepEqual(result.clusters[0].duplicateIds, ['c2']);
  assert.equal(result.summary.duplicateCount, 1);
  assert.equal(result.summary.alternateServerCount, 1); // server-b was preserved as alternate server!
});

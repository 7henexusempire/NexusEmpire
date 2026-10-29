export interface ChannelStream {
  id: string;
  title: string;
  url: string;
  logo?: string;
  group?: string;
  tvgId?: string;
  tvgName?: string;
  sourceId: string;
  sourceName: string;
  headers?: Record<string, string>;
  status?: 'active' | 'quarantined' | 'trashed';
  duplicateOf?: string;
  serverSignature?: string;
  quality?: string;
  notes?: string;
  addedAt?: number;
}

export interface PlaylistSource {
  id: string;
  name: string;
  url: string;
  backupUrl?: string;
  type: 'm3u' | 'json' | 'streambox' | 'custom';
  category: 'global' | 'nexus' | 'events' | 'custom';
  channelCount: number;
  lastFetched?: string;
  status: 'online' | 'fetching' | 'error' | 'idle';
  error?: string;
  autoRefresh: boolean;
  headers?: Record<string, string>;
}

export interface RebuildCategory {
  id: string;
  name: string;
  order: number;
  channelIds: string[];
}

export interface DuplicateCluster {
  clusterId: string;
  canonicalId: string;
  channelName: string;
  reason: string;
  isSameServer: boolean;
  duplicateIds: string[];
}

export interface GeneratorConfig {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: 'combined' | 'source' | 'category' | 'rebuild';
  sourceIds?: string[];
  groups?: string[];
  format: 'm3u' | 'm3u8' | 'json';
}

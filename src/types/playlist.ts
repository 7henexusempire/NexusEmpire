export interface ChannelStream {
  id: string;
  title: string;
  url: string;
  logo?: string;
  group?: string;
  tvgId?: string;
  tvgName?: string;
  chno?: string;
  sourceId: string;
  sourceName: string;
  headers?: Record<string, string>;
  status?: 'active' | 'quarantined' | 'trashed';
  duplicateOf?: string;
  serverSignature?: string;
  quality?: string;
  notes?: string;
  addedAt?: number;
  enabled?: boolean;
  // Custom Overrides
  customName?: string;
  customGroup?: string;
  customLogo?: string;
  customUrl?: string;
  customChno?: string;
  directives?: string[];
}

export interface PlaylistSource {
  id: string;
  name: string;
  slug: string; // custom URL slug: /:slug.m3u or /playlist/:slug.m3u
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
  slug: string; // e.g. /api/rebuilt/:slug.m3u
  order: number;
  channelIds: string[];
  logo?: string;
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

export interface AppSettings {
  domain: string; // e.g. "thenexusempire.com"
  port: number; // e.g. 8443
  hidePort: boolean; // true -> generates https://thenexusempire.com/... without :8443
  publicBaseUrl: string; // e.g. "https://thenexusempire.com"
  customTvgUrl: string;
  syncIntervalMinutes: number;
  autoSync: boolean;
  userAgent: string;
}

export interface CloudStreamItem {
  id: string;
  name: string;
  internalName?: string;
  url: string;
  category: string;
  logo: string;
  description: string;
  author?: string;
  version?: string;
  language?: string;
  tvTypes?: string[];
  fileSize?: number;
  fileHash?: string;
  status?: number;
  enabled: boolean;
  repoUrl: string;
  repoName?: string;
  updatedAt?: string;
}

export interface SkyStreamItem {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  url: string;
  category: string;
  logo?: string;
  enabled: boolean;
}

export interface StremioAddon {
  id: string;
  name: string;
  version: string;
  description: string;
  manifestUrl: string;
  logo: string;
  types: string[];
  enabled: boolean;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChannelItem {
  id: string;
  sourceId: string;
  name: string;
  url: string;
  tvgId: string | null;
  tvgName: string | null;
  tvgLogo: string | null;
  tvgChno: string | null;
  groupTitle: string;
  groupLogo: string | null;
  enabled: boolean;
  
  // Custom Overrides
  customName?: string;
  customLogo?: string;
  customGroup?: string;
  customUrl?: string;
  customChno?: string;
  customGroupLogo?: string;
  
  // Extras
  isCustom?: boolean;
  type?: 'stream' | 'video' | 'header';
  hasClearKey?: boolean;
  clearKeySnippet?: string | null;
  directives?: string[];
  preDirectives?: string[];
  postDirectives?: string[];
  streamVariant?: number;
}

export interface PlaylistSource {
  id: string;
  slug: string;
  name: string;
  url: string;
  type: 'remote' | 'uploaded';
  enabled: boolean;
  lastSyncTime: string | null;
  status: 'idle' | 'fetching' | 'success' | 'error';
  errorMessage: string | null;
  channelCount: number;
  filePath?: string;
}

export interface NexusEmpireItem {
  id: string;
  name: string;
  uri: string;
  hash: string;
  slug: string;
  m3uSlug: string;
  category: string;
  channelCount: number;
  status: 'ready' | 'syncing' | 'error';
  lastUpdated: string | null;
  logo: string;
  description: string;
  enabled: boolean;
}

export interface PlaylistSettings {
  syncIntervalMinutes: number;
  autoSync: boolean;
  userAgent: string;
  customTvgUrl: string;
  publicBaseUrl: string;
  zeotvStripSuffix: boolean;
  zeotvRemoveGroupLogo: boolean;
  appTitle: string;
  dedupMode: 'smart' | 'strict' | 'url_only' | 'off';
}

export interface RebuiltPlaylist {
  id: string;
  slug: string;
  name: string;
  description: string;
  targetType: 'nexusempire' | 'normal';
  targetSourceOrCategory: string;
  customCategories: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
}

export interface CustomizationData {
  sources: PlaylistSource[];
  channelOverrides: Record<string, Partial<ChannelItem>>;
  groupRenames: Record<string, string>;
  groupLogos: Record<string, string>;
  groupVisibility: Record<string, boolean>;
  customChannels: ChannelItem[];
  settings: PlaylistSettings;
  nexusempireItems?: NexusEmpireItem[];
  nexusempireCategories?: string[];
  nexusempireChannelAssignments?: Record<string, string[]>;
}

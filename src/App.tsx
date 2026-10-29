/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  ChannelStream,
  PlaylistSource,
  RebuildCategory,
  AppSettings,
  CloudStreamItem,
  SkyStreamItem,
  StremioAddon,
} from './types/playlist';
import { VideoBackground } from './components/VideoBackground';
import { Navbar, TabKey } from './components/Navbar';
import { GlobalPlaylistsTab } from './components/GlobalPlaylistsTab';
import { NexusEmpireTab } from './components/NexusEmpireTab';
import { LiveEventsTab } from './components/LiveEventsTab';
import { NexusRebuildTab } from './components/NexusRebuildTab';
import { GroupManagerTab } from './components/GroupManagerTab';
import { CloudStreamTab } from './components/CloudStreamTab';
import { SkyStreamTab } from './components/SkyStreamTab';
import { AiDeduplicationTab } from './components/AiDeduplicationTab';
import { M3uGeneratorTab } from './components/M3uGeneratorTab';
import { StreamPlayerModal } from './components/StreamPlayerModal';
import { EditStreamModal } from './components/EditStreamModal';
import { EditSourceModal } from './components/EditSourceModal';
import { AddSourceModal } from './components/AddSourceModal';
import { AddStreamModal } from './components/AddStreamModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('global');

  // Application Data States
  const [sources, setSources] = useState<PlaylistSource[]>([]);
  const [channels, setChannels] = useState<ChannelStream[]>([]);
  const [groups, setGroups] = useState<{ name: string; count: number; logo?: string }[]>([]);
  const [rebuildCategories, setRebuildCategories] = useState<RebuildCategory[]>([]);
  const [cloudstreamItems, setCloudstreamItems] = useState<CloudStreamItem[]>([]);
  const [skystreamItems, setSkystreamItems] = useState<SkyStreamItem[]>([]);
  const [stremioAddons, setStremioAddons] = useState<StremioAddon[]>([]);

  // Settings State with thenexusempire.com and port 8443 stripping
  const [settings, setSettings] = useState<AppSettings>({
    domain: 'thenexusempire.com',
    port: 8443,
    hidePort: true,
    publicBaseUrl: 'https://thenexusempire.com',
    customTvgUrl: 'https://thenexusempire.com/epg.xml',
    syncIntervalMinutes: 15,
    autoSync: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 TiviMate/4.7.0',
  });

  const [nextScheduledFetch, setNextScheduledFetch] = useState<number>(Date.now() + 15 * 60 * 1000);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  // Modal States
  const [activePlayerStream, setActivePlayerStream] = useState<ChannelStream | null>(null);
  const [editingStream, setEditingStream] = useState<ChannelStream | null>(null);
  const [editingSource, setEditingSource] = useState<PlaylistSource | null>(null);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isAddStreamOpen, setIsAddStreamOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Compute public base URL
  const publicBaseUrl = settings.publicBaseUrl && settings.publicBaseUrl.trim()
    ? settings.publicBaseUrl.trim().replace(/\/+$/, '')
    : `https://${settings.domain}`;

  // Load status and settings
  const fetchStatusAndSettings = useCallback(async () => {
    try {
      const [statusRes, settingsRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/settings'),
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setNextScheduledFetch(data.nextScheduledFetch || Date.now() + 15 * 60 * 1000);
        setIsFetching(data.isFetching || false);
      }

      if (settingsRes.ok) {
        const setts = await settingsRes.json();
        setSettings((prev) => ({ ...prev, ...setts }));
      }
    } catch {
      // offline / starting
    }
  }, []);

  // Load sources
  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch('/api/playlists');
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch (err) {
      console.error('Failed to load sources:', err);
    }
  }, []);

  // Load streams
  const fetchStreams = useCallback(async () => {
    try {
      const res = await fetch('/api/streams?limit=5000');
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (err) {
      console.error('Failed to load streams:', err);
    }
  }, []);

  // Load groups / categories
  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    }
  }, []);

  // Load rebuild categories
  const fetchRebuildCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/rebuild/categories');
      if (res.ok) {
        const data = await res.json();
        setRebuildCategories(data);
      }
    } catch (err) {
      console.error('Failed to load rebuild categories:', err);
    }
  }, []);

  // Load CloudStream, SkyStream & Stremio Catalogs
  const fetchCatalogs = useCallback(async () => {
    try {
      const [csRes, skyRes, stremioRes] = await Promise.all([
        fetch('/api/cloudstream/items'),
        fetch('/api/skystream/extensions'),
        fetch('/api/stremio/addons'),
      ]);

      if (csRes.ok) setCloudstreamItems(await csRes.json());
      if (skyRes.ok) setSkystreamItems(await skyRes.json());
      if (stremioRes.ok) setStremioAddons(await stremioRes.json());
    } catch (err) {
      console.warn('Catalog fetch:', err);
    }
  }, []);

  // Master refresh function
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchStatusAndSettings(),
      fetchSources(),
      fetchStreams(),
      fetchGroups(),
      fetchRebuildCategories(),
      fetchCatalogs(),
    ]);
  }, [
    fetchStatusAndSettings,
    fetchSources,
    fetchStreams,
    fetchGroups,
    fetchRebuildCategories,
    fetchCatalogs,
  ]);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(fetchStatusAndSettings, 5000);
    return () => clearInterval(interval);
  }, [refreshAll, fetchStatusAndSettings]);

  // Action: Fetch All Sources
  const handleFetchAll = async () => {
    setIsFetching(true);
    try {
      await fetch('/api/playlists/fetch-all', { method: 'POST' });
      await refreshAll();
    } catch (err) {
      console.error('Error fetching all:', err);
    } finally {
      setIsFetching(false);
    }
  };

  // Action: Fetch Single Source
  const handleFetchSource = async (sourceId: string) => {
    try {
      await fetch(`/api/playlists/${sourceId}/fetch`, { method: 'POST' });
      await refreshAll();
    } catch (err) {
      console.error(`Error fetching source ${sourceId}:`, err);
    }
  };

  // Action: Toggle AutoRefresh on source
  const handleToggleAutoRefresh = async (source: PlaylistSource) => {
    try {
      await fetch(`/api/playlists/${source.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoRefresh: !source.autoRefresh }),
      });
      await fetchSources();
    } catch (err) {
      console.error('Error updating source:', err);
    }
  };

  // Action: Delete Source
  const handleDeleteSource = async (sourceId: string) => {
    if (!window.confirm('Are you sure you want to remove this source?')) return;
    try {
      await fetch(`/api/playlists/${sourceId}`, { method: 'DELETE' });
      await refreshAll();
    } catch (err) {
      console.error('Error deleting source:', err);
    }
  };

  // Action: Add Source
  const handleAddSource = async (sourceData: any) => {
    try {
      await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceData),
      });
      await refreshAll();
    } catch (err) {
      console.error('Error adding source:', err);
    }
  };

  // Action: Edit / Save Source (rename playlist & slug)
  const handleSaveSource = async (id: string, updated: Partial<PlaylistSource>) => {
    try {
      await fetch(`/api/playlists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      await fetchSources();
    } catch (err) {
      console.error('Error updating source:', err);
    }
  };

  // Action: Add Custom Stream
  const handleAddCustomStream = async (streamData: Partial<ChannelStream>) => {
    try {
      await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streamData),
      });
      await refreshAll();
    } catch (err) {
      console.error('Error adding stream:', err);
    }
  };

  // Action: Update Stream Attributes
  const handleUpdateStream = async (updated: Partial<ChannelStream>) => {
    if (!updated.id) return;
    try {
      await fetch(`/api/streams/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      await refreshAll();
    } catch (err) {
      console.error('Error saving stream:', err);
    }
  };

  // Action: Move stream to trash
  const handleDeleteStream = async (streamId: string) => {
    try {
      await fetch(`/api/streams/${streamId}`, { method: 'DELETE' });
      setChannels((prev) =>
        prev.map((c) => (c.id === streamId ? { ...c, status: 'trashed' } : c))
      );
    } catch (err) {
      console.error('Error deleting stream:', err);
    }
  };

  // Action: Restore stream from trash
  const handleRestoreFromTrash = async (streamId: string) => {
    try {
      await fetch(`/api/streams/${streamId}/restore`, { method: 'POST' });
      setChannels((prev) =>
        prev.map((c) => (c.id === streamId ? { ...c, status: 'active' } : c))
      );
    } catch (err) {
      console.error('Error restoring stream:', err);
    }
  };

  // Action: Empty trash
  const handleEmptyTrash = async () => {
    if (!window.confirm('Permanently purge all quarantined channels from trash?')) return;
    try {
      await fetch('/api/trash/empty', { method: 'POST' });
      setChannels((prev) => prev.filter((c) => c.status !== 'trashed'));
    } catch (err) {
      console.error('Error emptying trash:', err);
    }
  };

  // Action: Bulk quarantine duplicates
  const handleBulkQuarantine = async (duplicateIds: string[]) => {
    try {
      await fetch('/api/ai/quarantine-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duplicateIds }),
      });
      setChannels((prev) =>
        prev.map((c) => (duplicateIds.includes(c.id) ? { ...c, status: 'trashed' } : c))
      );
    } catch (err) {
      console.error('Error bulk quarantining:', err);
    }
  };

  // Rebuild category operations
  const handleAddCategory = async (name: string) => {
    try {
      const res = await fetch('/api/rebuild/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const newCat = await res.json();
        setRebuildCategories((prev) => [...prev, newCat]);
      }
    } catch (err) {
      console.error('Error creating category:', err);
    }
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    try {
      await fetch(`/api/rebuild/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      setRebuildCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name } : c))
      );
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await fetch(`/api/rebuild/categories/${id}`, { method: 'DELETE' });
      setRebuildCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const handleAddStreamToCategory = async (categoryId: string, channelId: string) => {
    try {
      const res = await fetch('/api/rebuild/add-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, channelId }),
      });
      if (res.ok) {
        const updatedCat = await res.json();
        setRebuildCategories((prev) =>
          prev.map((c) => (c.id === categoryId ? updatedCat : c))
        );
      }
    } catch (err) {
      console.error('Error adding stream to category:', err);
    }
  };

  const handleRemoveStreamFromCategory = async (categoryId: string, channelId: string) => {
    try {
      const res = await fetch('/api/rebuild/remove-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, channelId }),
      });
      if (res.ok) {
        const updatedCat = await res.json();
        setRebuildCategories((prev) =>
          prev.map((c) => (c.id === categoryId ? updatedCat : c))
        );
      }
    } catch (err) {
      console.error('Error removing stream from category:', err);
    }
  };

  // Group Management Actions
  const handleRenameGroup = async (oldName: string, newName: string) => {
    try {
      await fetch('/api/groups/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName }),
      });
      await Promise.all([fetchGroups(), fetchStreams()]);
    } catch (err) {
      console.error('Error renaming group:', err);
    }
  };

  const handleBulkSetLogo = async (groupName: string, logoUrl: string) => {
    try {
      await fetch('/api/groups/bulk-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName, logoUrl }),
      });
      await Promise.all([fetchGroups(), fetchStreams()]);
    } catch (err) {
      console.error('Error setting group logo:', err);
    }
  };

  const handleRemovePrefix = async (prefix: string) => {
    try {
      await fetch('/api/groups/remove-prefix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix }),
      });
      await Promise.all([fetchGroups(), fetchStreams()]);
    } catch (err) {
      console.error('Error stripping prefix:', err);
    }
  };

  const handleDeleteGroup = async (groupName: string, deleteChannels: boolean) => {
    if (!window.confirm(`Delete category "${groupName}"?`)) return;
    try {
      await fetch('/api/groups/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName, deleteChannels }),
      });
      await Promise.all([fetchGroups(), fetchStreams()]);
    } catch (err) {
      console.error('Error deleting group:', err);
    }
  };

  const handleCreateGroup = async (name: string) => {
    setGroups((prev) => [...prev, { name, count: 0 }]);
  };

  // Settings & Backup
  const handleSaveSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const saved = await res.json();
        setSettings(saved);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const handleExportBackup = () => {
    window.location.href = '/api/backup/export';
  };

  const handleImportBackup = async (data: any) => {
    await fetch('/api/backup/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await refreshAll();
  };

  const activeChannelCount = channels.filter((c) => c.status !== 'trashed').length;
  const availableGroupNames = groups.map((g) => g.name);

  return (
    <div className="min-h-screen text-gray-100 relative selection:bg-amber-500 selection:text-black">
      {/* Background Video directly from Cloudfront without blur */}
      <VideoBackground />

      {/* Main Header / Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalChannels={activeChannelCount}
        totalSources={sources.length}
        domain={settings.domain}
        publicBaseUrl={publicBaseUrl}
        nextScheduledFetch={nextScheduledFetch}
        isFetching={isFetching}
        onFetchAll={handleFetchAll}
        onOpenAddSource={() => setIsAddSourceOpen(true)}
        onOpenAddStream={() => setIsAddStreamOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'global' && (
          <GlobalPlaylistsTab
            sources={sources}
            channels={channels}
            rebuildCategories={rebuildCategories}
            publicBaseUrl={publicBaseUrl}
            onPlayStream={(s) => setActivePlayerStream(s)}
            onEditStream={(s) => setEditingStream(s)}
            onDeleteStream={handleDeleteStream}
            onAddToRebuild={handleAddStreamToCategory}
            onFetchSource={handleFetchSource}
            onToggleAutoRefresh={handleToggleAutoRefresh}
            onDeleteSource={handleDeleteSource}
            onOpenAddSource={() => setIsAddSourceOpen(true)}
            onEditSource={(src) => setEditingSource(src)}
          />
        )}

        {activeTab === 'nexus' && (
          <NexusEmpireTab
            channels={channels}
            rebuildCategories={rebuildCategories}
            onPlayStream={(s) => setActivePlayerStream(s)}
            onEditStream={(s) => setEditingStream(s)}
            onDeleteStream={handleDeleteStream}
            onAddToRebuild={handleAddStreamToCategory}
            onAddCustomStream={handleAddCustomStream}
          />
        )}

        {activeTab === 'events' && (
          <LiveEventsTab
            channels={channels}
            sources={sources}
            rebuildCategories={rebuildCategories}
            onPlayStream={(s) => setActivePlayerStream(s)}
            onEditStream={(s) => setEditingStream(s)}
            onAddToRebuild={handleAddStreamToCategory}
            onFetchSource={handleFetchSource}
          />
        )}

        {activeTab === 'rebuild' && (
          <NexusRebuildTab
            categories={rebuildCategories}
            allChannels={channels}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onRemoveStreamFromCategory={handleRemoveStreamFromCategory}
            onAddStreamToCategory={handleAddStreamToCategory}
            onPlayStream={(s) => setActivePlayerStream(s)}
            onEditStream={(s) => setEditingStream(s)}
          />
        )}

        {activeTab === 'groups' && (
          <GroupManagerTab
            groups={groups}
            publicBaseUrl={publicBaseUrl}
            onRenameGroup={handleRenameGroup}
            onBulkSetLogo={handleBulkSetLogo}
            onRemovePrefix={handleRemovePrefix}
            onDeleteGroup={handleDeleteGroup}
            onCreateGroup={handleCreateGroup}
          />
        )}

        {activeTab === 'cloudstream' && (
          <CloudStreamTab
            items={cloudstreamItems}
            publicBaseUrl={publicBaseUrl}
          />
        )}

        {activeTab === 'skystream' && (
          <SkyStreamTab
            skyItems={skystreamItems}
            stremioAddons={stremioAddons}
            publicBaseUrl={publicBaseUrl}
          />
        )}

        {activeTab === 'dedup' && (
          <AiDeduplicationTab
            channels={channels}
            onPlayStream={(s) => setActivePlayerStream(s)}
            onSendToTrash={handleDeleteStream}
            onRestoreFromTrash={handleRestoreFromTrash}
            onEmptyTrash={handleEmptyTrash}
            onBulkQuarantine={handleBulkQuarantine}
          />
        )}

        {activeTab === 'generator' && (
          <M3uGeneratorTab
            sources={sources}
            channels={channels}
            publicBaseUrl={publicBaseUrl}
          />
        )}
      </main>

      {/* Modals */}
      {activePlayerStream && (
        <StreamPlayerModal
          stream={activePlayerStream}
          onClose={() => setActivePlayerStream(null)}
        />
      )}

      {editingStream && (
        <EditStreamModal
          stream={editingStream}
          availableGroups={availableGroupNames}
          onClose={() => setEditingStream(null)}
          onSave={handleUpdateStream}
        />
      )}

      {editingSource && (
        <EditSourceModal
          source={editingSource}
          publicBaseUrl={publicBaseUrl}
          onClose={() => setEditingSource(null)}
          onSave={handleSaveSource}
        />
      )}

      {isAddSourceOpen && (
        <AddSourceModal
          onClose={() => setIsAddSourceOpen(false)}
          onAdd={handleAddSource}
        />
      )}

      {isAddStreamOpen && (
        <AddStreamModal
          onClose={() => setIsAddStreamOpen(false)}
          onAdd={handleAddCustomStream}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
        />
      )}
    </div>
  );
}

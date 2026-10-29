/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ChannelStream, PlaylistSource, RebuildCategory } from './types/playlist';
import { VideoBackground } from './components/VideoBackground';
import { Navbar, TabKey } from './components/Navbar';
import { GlobalPlaylistsTab } from './components/GlobalPlaylistsTab';
import { NexusEmpireTab } from './components/NexusEmpireTab';
import { LiveEventsTab } from './components/LiveEventsTab';
import { NexusRebuildTab } from './components/NexusRebuildTab';
import { AiDeduplicationTab } from './components/AiDeduplicationTab';
import { M3uGeneratorTab } from './components/M3uGeneratorTab';
import { StreamPlayerModal } from './components/StreamPlayerModal';
import { EditStreamModal } from './components/EditStreamModal';
import { AddSourceModal } from './components/AddSourceModal';
import { AddStreamModal } from './components/AddStreamModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('global');

  // Application Data States
  const [sources, setSources] = useState<PlaylistSource[]>([]);
  const [channels, setChannels] = useState<ChannelStream[]>([]);
  const [rebuildCategories, setRebuildCategories] = useState<RebuildCategory[]>([]);
  const [nextScheduledFetch, setNextScheduledFetch] = useState<number>(Date.now() + 15 * 60 * 1000);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  // Modal States
  const [activePlayerStream, setActivePlayerStream] = useState<ChannelStream | null>(null);
  const [editingStream, setEditingStream] = useState<ChannelStream | null>(null);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isAddStreamOpen, setIsAddStreamOpen] = useState(false);

  // Load status and metadata
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setNextScheduledFetch(data.nextScheduledFetch || Date.now() + 15 * 60 * 1000);
        setIsFetching(data.isFetching || false);
        // If server channels count differs from current channels length and not currently fetching, refresh
        if (data.totalChannels && data.totalChannels !== channels.length && !data.isFetching) {
          fetchSources();
          fetchStreams();
        }
      }
    } catch {
      // offline / starting
    }
  }, [channels.length]);

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
      // Fetch both active and trashed streams for the full app experience
      const res = await fetch('/api/streams?limit=5000');
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (err) {
      console.error('Failed to load streams:', err);
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

  // Master refresh function
  const refreshAll = useCallback(async () => {
    await Promise.all([fetchStatus(), fetchSources(), fetchStreams(), fetchRebuildCategories()]);
  }, [fetchStatus, fetchSources, fetchStreams, fetchRebuildCategories]);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [refreshAll, fetchStatus]);

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

  // Action: Update Stream
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

  // Action: Rebuild category operations
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

  const activeChannelCount = channels.filter((c) => c.status !== 'trashed').length;

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
        nextScheduledFetch={nextScheduledFetch}
        isFetching={isFetching}
        onFetchAll={handleFetchAll}
        onOpenAddSource={() => setIsAddSourceOpen(true)}
        onOpenAddStream={() => setIsAddStreamOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'global' && (
          <GlobalPlaylistsTab
            sources={sources}
            channels={channels}
            rebuildCategories={rebuildCategories}
            onPlayStream={(s) => setActivePlayerStream(s)}
            onEditStream={(s) => setEditingStream(s)}
            onDeleteStream={handleDeleteStream}
            onAddToRebuild={handleAddStreamToCategory}
            onFetchSource={handleFetchSource}
            onToggleAutoRefresh={handleToggleAutoRefresh}
            onDeleteSource={handleDeleteSource}
            onOpenAddSource={() => setIsAddSourceOpen(true)}
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
          <M3uGeneratorTab sources={sources} channels={channels} />
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
          onClose={() => setEditingStream(null)}
          onSave={handleUpdateStream}
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
    </div>
  );
}

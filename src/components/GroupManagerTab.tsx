import React, { useState } from 'react';
import {
  Folder,
  Edit2,
  Trash2,
  Image,
  Share2,
  Copy,
  Check,
  Scissors,
  Plus,
  Search,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface GroupInfo {
  name: string;
  count: number;
  logo?: string;
}

interface GroupManagerTabProps {
  groups: GroupInfo[];
  publicBaseUrl: string;
  onRenameGroup: (oldName: string, newName: string) => Promise<void>;
  onBulkSetLogo: (groupName: string, logoUrl: string) => Promise<void>;
  onRemovePrefix: (prefix: string) => Promise<void>;
  onDeleteGroup: (groupName: string, deleteChannels: boolean) => Promise<void>;
  onCreateGroup: (name: string) => Promise<void>;
}

export const GroupManagerTab: React.FC<GroupManagerTabProps> = ({
  groups,
  publicBaseUrl,
  onRenameGroup,
  onBulkSetLogo,
  onRemovePrefix,
  onDeleteGroup,
  onCreateGroup,
}) => {
  const [search, setSearch] = useState('');
  const [editingGroupName, setEditingGroupName] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingLogoGroup, setEditingLogoGroup] = useState<string | null>(null);
  const [groupLogoUrl, setGroupLogoUrl] = useState('');
  const [prefixToStrip, setPrefixToStrip] = useState('Jio TV+ | ');
  const [copiedGroupUrl, setCopiedGroupUrl] = useState<string | null>(null);
  const [createCategoryInput, setCreateCategoryInput] = useState('');

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartRename = (name: string) => {
    setEditingGroupName(name);
    setNewGroupName(name);
  };

  const handleSaveRename = async (oldName: string) => {
    if (newGroupName.trim() && newGroupName.trim() !== oldName) {
      await onRenameGroup(oldName, newGroupName.trim());
    }
    setEditingGroupName(null);
  };

  const handleStartSetLogo = (group: GroupInfo) => {
    setEditingLogoGroup(group.name);
    setGroupLogoUrl(group.logo || '');
  };

  const handleSaveSetLogo = async (groupName: string) => {
    if (groupLogoUrl.trim()) {
      await onBulkSetLogo(groupName, groupLogoUrl.trim());
    }
    setEditingLogoGroup(null);
  };

  const handleCopyM3U = (groupName: string) => {
    const encoded = encodeURIComponent(groupName);
    const url = `${publicBaseUrl}/playlist/group/${encoded}.m3u`;
    navigator.clipboard.writeText(url);
    setCopiedGroupUrl(groupName);
    setTimeout(() => setCopiedGroupUrl(null), 2000);
  };

  const handleCreateNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createCategoryInput.trim()) return;
    await onCreateGroup(createCategoryInput.trim());
    setCreateCategoryInput('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="crystal-panel rounded-xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Folder className="w-5 h-5 text-amber-400" />
              Category & Group Management Studio
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-2xl">
              Rename categories, bulk apply group logos across thousands of channels, strip messy channel prefixes,
              and copy dedicated live M3U URLs for any single category.
            </p>
          </div>

          <form onSubmit={handleCreateNewCategory} className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={createCategoryInput}
              onChange={(e) => setCreateCategoryInput(e.target.value)}
              placeholder="New Category Name..."
              className="px-3 py-1.5 text-xs rounded-lg crystal-input text-white w-48"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-gray-950 transition-colors shrink-0 flex items-center gap-1 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
          </form>
        </div>
      </section>

      {/* Prefix Stripper Utility */}
      <section className="crystal-panel-subtle rounded-xl p-4 border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-white">Strip Unwanted Category Prefix</h4>
            <p className="text-[11px] text-gray-400">
              Clean up raw provider prefixes across all stream categories in one click.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={prefixToStrip}
            onChange={(e) => setPrefixToStrip(e.target.value)}
            placeholder="e.g. Jio TV+ | "
            className="px-3 py-1.5 text-xs rounded-lg crystal-input text-white font-mono w-44"
          />
          <button
            onClick={() => onRemovePrefix(prefixToStrip)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shrink-0"
          >
            Strip Prefix
          </button>
        </div>
      </section>

      {/* Category List & Quick Tools */}
      <section className="crystal-panel rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg crystal-input text-white"
            />
          </div>

          <div className="text-xs text-gray-400">
            Total Categories: <strong className="text-white font-mono">{groups.length}</strong>
          </div>
        </div>

        {/* Categories Table / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredGroups.map((group) => {
            const isEditing = editingGroupName === group.name;
            const isEditingLogo = editingLogoGroup === group.name;
            const isCopied = copiedGroupUrl === group.name;

            return (
              <div
                key={group.name}
                className="crystal-panel-subtle hover:bg-white/10 p-3.5 rounded-xl border border-white/10 flex flex-col justify-between gap-3 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                        {group.logo ? (
                          <img
                            src={group.logo}
                            alt=""
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Folder className="w-4 h-4 text-amber-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={newGroupName}
                              onChange={(e) => setNewGroupName(e.target.value)}
                              className="px-2 py-1 text-xs rounded bg-black text-white border border-cyan-400 w-full"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveRename(group.name)}
                              className="p-1 rounded bg-emerald-600 text-white"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <h4
                            className="text-xs font-bold text-white truncate flex items-center gap-1.5"
                            title={group.name}
                          >
                            <span>{group.name}</span>
                          </h4>
                        )}
                        <p className="text-[11px] font-mono text-cyan-300 mt-0.5">
                          {group.count} channels
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleStartRename(group.name)}
                        className="p-1 rounded bg-black/40 hover:bg-black/70 text-gray-300 hover:text-white"
                        title="Rename Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStartSetLogo(group)}
                        className="p-1 rounded bg-black/40 hover:bg-black/70 text-gray-300 hover:text-white"
                        title="Change Category Logo (Bulk apply to all streams in group)"
                      >
                        <Image className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteGroup(group.name, false)}
                        className="p-1 rounded bg-black/40 hover:bg-rose-950/60 text-gray-400 hover:text-rose-400"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Logo Editor Inline */}
                  {isEditingLogo && (
                    <div className="mt-2 p-2 rounded-lg bg-black/70 border border-cyan-400/40 space-y-2 text-xs">
                      <span className="text-[10px] text-gray-300 font-semibold block">
                        Set Logo for all channels in this category:
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={groupLogoUrl}
                          onChange={(e) => setGroupLogoUrl(e.target.value)}
                          placeholder="https://.../logo.png"
                          className="px-2 py-1 text-xs rounded crystal-input text-white w-full"
                        />
                        <button
                          onClick={() => handleSaveSetLogo(group.name)}
                          className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Row: Dedicated M3U URL */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-gray-400 font-mono truncate">
                    /playlist/group/{encodeURIComponent(group.name)}.m3u
                  </span>

                  <button
                    onClick={() => handleCopyM3U(group.name)}
                    className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-white font-medium"
                    title="Copy Dedicated M3U URL for this category"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? 'Copied' : 'Copy M3U'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

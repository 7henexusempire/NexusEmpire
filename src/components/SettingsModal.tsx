import React, { useState } from 'react';
import { AppSettings } from '../types/playlist';
import { X, Save, Globe, Shield, Download, Upload, Check, Server, Radio } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onClose: () => void;
  onSave: (newSettings: Partial<AppSettings>) => Promise<void>;
  onExportBackup: () => void;
  onImportBackup: (data: any) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onClose,
  onSave,
  onExportBackup,
  onImportBackup,
}) => {
  const [domain, setDomain] = useState(settings.domain || 'thenexusempire.com');
  const [port, setPort] = useState(settings.port || 8443);
  const [hidePort, setHidePort] = useState(settings.hidePort !== false);
  const [publicBaseUrl, setPublicBaseUrl] = useState(settings.publicBaseUrl || 'https://thenexusempire.com');
  const [customTvgUrl, setCustomTvgUrl] = useState(settings.customTvgUrl || 'https://thenexusempire.com/epg.xml');
  const [syncInterval, setSyncInterval] = useState(settings.syncIntervalMinutes || 15);
  const [userAgent, setUserAgent] = useState(settings.userAgent || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        domain: domain.trim(),
        port: Number(port),
        hidePort,
        publicBaseUrl: publicBaseUrl.trim(),
        customTvgUrl: customTvgUrl.trim(),
        syncIntervalMinutes: Number(syncInterval),
        userAgent: userAgent.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        await onImportBackup(json);
        setImportStatus('Backup restored successfully!');
        setTimeout(() => setImportStatus(null), 3000);
      } catch (err: any) {
        setImportStatus('Error importing backup: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="crystal-panel rounded-2xl w-full max-w-xl overflow-hidden border border-cyan-400/30 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              Domain, VPS Port 8443 & System Settings
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
          {/* Domain & Port 8443 settings */}
          <div className="crystal-panel-subtle p-3.5 rounded-xl border border-cyan-500/20 space-y-3">
            <h4 className="font-bold text-white text-xs flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              VPS Domain & Port 8443 Clean URLs
            </h4>
            <p className="text-[11px] text-gray-300">
              When hosting on your Contabo VPS (port 8443), M3U playlists will cleanly use your domain without revealing port 8443.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Domain Name</label>
                <input
                  type="text"
                  required
                  value={domain}
                  onChange={(e) => {
                    const newDom = e.target.value;
                    setDomain(newDom);
                    setPublicBaseUrl(`https://${newDom.trim()}`);
                  }}
                  className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
                  placeholder="thenexusempire.com"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">VPS Port</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
                  placeholder="8443"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hidePort}
                  onChange={(e) => setHidePort(e.target.checked)}
                  className="rounded bg-black border-white/20 text-cyan-400 focus:ring-0"
                />
                <span className="font-semibold text-cyan-300">
                  Hide port in public M3U URLs (e.g. generate clean https://thenexusempire.com/...)
                </span>
              </label>
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">
                Public Base URL (Override for M3U generation)
              </label>
              <input
                type="text"
                value={publicBaseUrl}
                onChange={(e) => setPublicBaseUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
                placeholder="https://thenexusempire.com"
              />
            </div>
          </div>

          {/* EPG and User-Agent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-medium mb-1">TVG EPG URL (x-tvg-url)</label>
              <input
                type="text"
                value={customTvgUrl}
                onChange={(e) => setCustomTvgUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
                placeholder="https://thenexusempire.com/epg.xml"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">Auto-Fetch Interval (Mins)</label>
              <input
                type="number"
                min="1"
                max="1440"
                value={syncInterval}
                onChange={(e) => setSyncInterval(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">Fetcher User-Agent</label>
            <input
              type="text"
              value={userAgent}
              onChange={(e) => setUserAgent(e.target.value)}
              className="w-full px-3 py-2 rounded-lg crystal-input text-white font-mono text-[11px]"
            />
          </div>

          {/* Backup & Restore */}
          <div className="crystal-panel-subtle p-3.5 rounded-xl border border-white/10 space-y-2">
            <h4 className="font-bold text-white text-xs">Backup & Configuration Migration</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onExportBackup}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Full Backup JSON</span>
              </button>

              <label className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import Backup JSON</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            {importStatus && (
              <p className="text-[11px] font-mono text-cyan-300 mt-1">{importStatus}</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium bg-black/40 hover:bg-black/60 text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-gray-950 transition-colors shadow-md flex items-center gap-1.5"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-emerald-950" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Saved Settings!' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

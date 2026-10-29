import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { ChannelStream } from '../types/playlist';
import {
  X,
  Play,
  Volume2,
  VolumeX,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  Radio,
  Tv,
} from 'lucide-react';

interface StreamPlayerModalProps {
  stream: ChannelStream | null;
  onClose: () => void;
}

export const StreamPlayerModal: React.FC<StreamPlayerModalProps> = ({ stream, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useProxy, setUseProxy] = useState(false);
  const [playerStatus, setPlayerStatus] = useState<string>('Initializing...');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!stream) return;

    // Streambox protocol check
    if (stream.url.startsWith('streambox://')) {
      setPlayerStatus('Streambox Protocol Stream (Ready for AniTV / Streambox App)');
      return;
    }

    let hls: Hls | null = null;
    const video = videoRef.current;
    if (!video) return;

    setPlayerStatus('Connecting to stream feed...');

    const streamUrl = useProxy
      ? `/api/proxy?url=${encodeURIComponent(stream.url)}`
      : stream.url;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setPlayerStatus('Live Stream Manifest Ready');
        video.play().catch(() => {
          setPlayerStatus('Stream Loaded (Click Play)');
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setPlayerStatus('Network error (CORS restricted or stream offline). Try enabling Proxy fallback below.');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              setPlayerStatus('Unable to play stream directly. Use external player or AniTV.');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari / iOS HLS support
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
      });
    } else {
      setPlayerStatus('HLS format not supported natively in this browser');
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [stream, useProxy]);

  if (!stream) return null;

  const isStreambox = stream.url.startsWith('streambox://');

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(stream.url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="crystal-panel rounded-2xl w-full max-w-3xl overflow-hidden border border-cyan-400/30 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3 bg-black/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded bg-black/60 border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden">
              {stream.logo ? (
                <img
                  src={stream.logo}
                  alt={stream.title}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Tv className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-white truncate">{stream.title}</h3>
              <p className="text-[11px] text-gray-400 font-mono truncate">
                {stream.group} • {stream.sourceName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/40 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas or Streambox Panel */}
        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          {isStreambox ? (
            <div className="text-center p-6 space-y-3 max-w-md">
              <Radio className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
              <h4 className="font-bold text-white text-base">Streambox / AniTV Protocol Feed</h4>
              <p className="text-xs text-gray-300 leading-relaxed font-mono">
                {stream.url}
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <a
                  href={stream.url}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-gray-950 transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch in AniTV</span>
                </a>
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'Copied' : 'Copy Hash URL'}</span>
                </button>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Footer & Diagnostics */}
        <div className="p-4 bg-black/60 border-t border-white/10 space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono text-[11px] text-gray-300">{playerStatus}</span>
            </div>

            {!isStreambox && (
              <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={useProxy}
                  onChange={(e) => setUseProxy(e.target.checked)}
                  className="rounded bg-black border-white/20 text-cyan-400"
                />
                <span>Bypass CORS with Server Proxy</span>
              </label>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px] text-gray-400 font-mono">
            <span className="truncate" title={stream.url}>{stream.url}</span>
            <button
              onClick={handleCopyUrl}
              className="text-cyan-400 hover:text-cyan-300 shrink-0 font-sans font-medium flex items-center gap-1"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{isCopied ? 'Copied' : 'Copy URL'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

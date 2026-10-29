import React, { useRef, useState } from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';

export const VideoBackground: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden pointer-events-none select-none">
      {/* Background Video directly from CloudFront URL */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261022_042705_33276241-8c58-4a03-b4e8-765d6c616afd.mp4"
      />

      {/* Crisp Transparent Contrast Tint - NO blur as explicitly requested */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/75 pointer-events-none" />

      {/* Subtle Bottom Controls for Background Playback */}
      <div className="absolute bottom-4 right-4 pointer-events-auto flex items-center gap-2 z-10 opacity-70 hover:opacity-100 transition-opacity">
        <button
          onClick={toggleSound}
          title={isMuted ? 'Unmute Background Audio' : 'Mute Background Audio'}
          className="p-1.5 rounded-lg bg-black/60 border border-white/20 text-gray-300 hover:text-white hover:bg-black/80 transition-colors"
          aria-label={isMuted ? 'Unmute Background Audio' : 'Mute Background Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>
        <button
          onClick={togglePlayback}
          title={isPlaying ? 'Pause Background Video' : 'Play Background Video'}
          className="p-1.5 rounded-lg bg-black/60 border border-white/20 text-gray-300 hover:text-white hover:bg-black/80 transition-colors"
          aria-label={isPlaying ? 'Pause Background Video' : 'Play Background Video'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-amber-400" />}
        </button>
      </div>
    </div>
  );
};

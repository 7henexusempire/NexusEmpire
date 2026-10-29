import React, { useState } from 'react';

interface VideoBackgroundProps {
  videoUrl?: string;
  opacity?: number;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
  videoUrl = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261022_042705_33276241-8c58-4a03-b4e8-765d6c616afd.mp4',
  opacity = 1.0,
}) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {!hasError && (
        <video
          autoPlay
          loop
          muted
          playsInline
          onError={() => setHasError(true)}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity }}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}

      {/* Subtle transparent ambient tone without blurring or blacking out the background */}
      <div className="absolute inset-0 bg-slate-950/15 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45 pointer-events-none"></div>
    </div>
  );
};

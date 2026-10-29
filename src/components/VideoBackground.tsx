/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function VideoBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute min-w-full min-h-full object-cover"
      >
        <source 
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261022_042705_33276241-8c58-4a03-b4e8-765d6c616afd.mp4" 
          type="video/mp4" 
        />
      </video>
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}

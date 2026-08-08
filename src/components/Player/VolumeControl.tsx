/**
 * src/components/Player/VolumeControl.tsx
 *
 * Volume slider and mute toggle.
 */

import React, { useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';

export default function VolumeControl() {
  const { volume, isMuted, setVolume, toggleMute } = usePlayerStore();
  const sliderRef = useRef<HTMLDivElement>(null);

  const displayVolume = isMuted ? 0 : volume;

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    
    // Check if the left mouse button is pressed
    if (e.buttons !== 1) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newVolume = Math.max(0, Math.min(1, clickX / rect.width));
    
    setVolume(newVolume);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newVolume = Math.max(0, Math.min(1, clickX / rect.width));
    
    setVolume(newVolume);
  };

  return (
    <div className="flex items-center justify-end gap-3 text-[#b3b3b3]">
      {/* Now Playing View Icon */}
      <button type="button" className="hover:text-white transition-colors" aria-label="Now Playing View">
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
          <path d="M11.196 8l-4.22-4.22.707-.707L12.61 8l-4.927 4.927-.707-.707 4.22-4.22z"></path>
        </svg>
      </button>

      {/* Lyrics Icon */}
      <button type="button" className="hover:text-white transition-colors" aria-label="Lyrics">
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
          <path d="M13.426 2.574a2.831 2.831 0 00-4.797 1.55l3.247 3.247a2.831 2.831 0 001.55-4.797zM10.5 8.114L5.682 2.723H5.5a1 1 0 00-1 1v2.116L.265 9.074a2.002 2.002 0 002.828 2.828l4.48-4.48V14a1 1 0 001 1h.183l5.39-4.818L10.5 8.114z"></path>
        </svg>
      </button>

      {/* Queue Icon */}
      <button type="button" className="hover:text-white transition-colors" aria-label="Queue">
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
          <path d="M15 14.5H1v-1.5h14v1.5zm0-5.75H1v-1.5h14v1.5zM15 3H1V1.5h14V3z"></path>
        </svg>
      </button>

      {/* Connect to a device */}
      <button type="button" className="hover:text-white transition-colors" aria-label="Connect to a device">
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
          <path d="M6 2.75C6 1.784 6.784 1 7.75 1h6.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0114.25 15h-6.5A1.75 1.75 0 016 13.25V2.75zm1.75-.25a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h6.5a.25.25 0 00.25-.25V2.75a.25.25 0 00-.25-.25h-6.5zm-6 0a.25.25 0 00-.25.25v6.5c0 .138.112.25.25.25H4V11H1.75A1.75 1.75 0 010 9.25v-6.5C0 1.784.784 1 1.75 1H4v1.5H1.75zM4 15H2v-1.5h2V15z"></path>
        </svg>
      </button>

      <button
        type="button"
        onClick={toggleMute}
        className="hover:text-white transition-colors ml-2"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {displayVolume === 0 ? (
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
            <path d="M13.86 5.47a.75.75 0 00-1.061 0l-1.47 1.47-1.47-1.47A.75.75 0 008.8 6.53L10.269 8l-1.47 1.47a.75.75 0 101.06 1.06l1.47-1.47 1.47 1.47a.75.75 0 001.06-1.06L12.39 8l1.47-1.47a.75.75 0 000-1.06zM1.5 10V6H5l5.5-4.5v13L5 10H1.5z"></path>
          </svg>
        ) : displayVolume < 0.5 ? (
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
            <path d="M9.741.85a.75.75 0 01.375.65v13a.75.75 0 01-1.125.65l-6.925-4a3.642 3.642 0 01-1.33-4.967 3.639 3.639 0 011.33-1.332l6.925-4a.75.75 0 01.75 0zm-6.924 5.3a2.139 2.139 0 000 3.7l5.859 3.383V2.767L2.817 6.15zM13.5 12.5a.75.75 0 00.75-.75v-7.5a.75.75 0 00-1.5 0v7.5c0 .414.336.75.75.75z"></path>
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
            <path d="M9.741.85a.75.75 0 01.375.65v13a.75.75 0 01-1.125.65l-6.925-4a3.642 3.642 0 01-1.33-4.967 3.639 3.639 0 011.33-1.332l6.925-4a.75.75 0 01.75 0zm-6.924 5.3a2.139 2.139 0 000 3.7l5.859 3.383V2.767L2.817 6.15zM15.5 12.5a.75.75 0 00.75-.75v-7.5a.75.75 0 00-1.5 0v7.5c0 .414.336.75.75.75zM13.5 12.5a.75.75 0 00.75-.75v-7.5a.75.75 0 00-1.5 0v7.5c0 .414.336.75.75.75z"></path>
          </svg>
        )}
      </button>

      <div 
        ref={sliderRef}
        className="group relative flex h-3 w-[93px] cursor-pointer items-center"
        onClick={handleClick}
        onMouseMove={handleDrag}
      >
        {/* Background track */}
        <div className="h-1 w-full rounded-full bg-[#4d4d4d]">
          {/* Fill track */}
          <div 
            className="relative h-full rounded-full bg-white transition-all duration-75 ease-out group-hover:bg-[#1db954]"
            style={{ width: `${displayVolume * 100}%` }}
          >
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * src/components/Player/ProgressBar.tsx
 *
 * Seekable progress bar for the audio player.
 */

import React, { useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';



interface ProgressBarProps {
  audioRef: React.RefObject<HTMLAudioElement>;
}

export default function ProgressBar({ audioRef }: ProgressBarProps) {
  const { currentTimeMs, durationMs, currentTrack } = usePlayerStore();
  const progressBarRef = useRef<HTMLDivElement>(null);

  const disabled = !currentTrack;
  const progressPercent = durationMs > 0 ? (currentTimeMs / durationMs) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !progressBarRef.current || !audioRef.current || durationMs <= 0) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercent = Math.max(0, Math.min(1, clickX / rect.width));
    const newTimeMs = newPercent * durationMs;

    // Update the DOM element immediately for better UX
    audioRef.current.currentTime = newTimeMs / 1000;
    // Store is updated automatically by the 'timeupdate' event listener in useHlsPlayer
  };

  const formatTime = (ms: number) => {
    if (!ms || isNaN(ms)) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex w-full items-center gap-2 text-xs text-[#a7a7a7]">
      <div className="min-w-[40px] text-right">
        {formatTime(currentTimeMs)}
      </div>
      
      <div 
        ref={progressBarRef}
        className={`group relative flex h-3 w-full items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        onClick={handleSeek}
      >
        {/* Background track */}
        <div className="h-1 w-full rounded-full bg-[#4d4d4d]">
          {/* Fill track */}
          <div 
            className="relative h-full rounded-full bg-white transition-all duration-75 ease-out group-hover:bg-[#1db954]"
            style={{ width: `${progressPercent}%` }}
          >
          </div>
        </div>
      </div>

      <div className="min-w-[40px]">
        {formatTime(durationMs)}
      </div>
    </div>
  );
}

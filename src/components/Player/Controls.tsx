/**
 * src/components/Player/Controls.tsx
 *
 * Playback controls: play/pause, next/prev, shuffle, repeat
 */

import { usePlayerStore } from '@/stores/playerStore';
import ProgressBar from './ProgressBar';

interface ControlsProps {
  audioRef: React.RefObject<HTMLAudioElement>;
}

export default function Controls({ audioRef }: ControlsProps) {
  const { 
    currentTrack, 
    isPlaying, 
    isLoading,
    setIsPlaying, 
    skipNext, 
    skipPrev,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat
  } = usePlayerStore();

  const disabled = !currentTrack;

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {/* Playback Buttons */}
      <div className="flex items-center gap-6">
        {/* Shuffle Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={toggleShuffle}
          className={`flex h-8 w-8 items-center justify-center transition-colors ${
            shuffle ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          aria-label="Enable shuffle"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 relative">
            <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            {shuffle && (
              <span className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#1db954]" />
            )}
          </svg>
        </button>

        {/* Previous Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={skipPrev}
          className={`flex h-8 w-8 items-center justify-center transition-colors ${
            disabled ? 'cursor-not-allowed opacity-50 text-[#b3b3b3]' : 'text-[#b3b3b3] hover:text-white'
          }`}
          aria-label="Previous"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>

        {/* Play/Pause Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95 ${
            disabled ? 'cursor-not-allowed opacity-50 hover:scale-100' : ''
          }`}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
             <svg className="h-4 w-4 animate-spin text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-[2px] h-4 w-4">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        {/* Next Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={skipNext}
          className={`flex h-8 w-8 items-center justify-center transition-colors ${
            disabled ? 'cursor-not-allowed opacity-50 text-[#b3b3b3]' : 'text-[#b3b3b3] hover:text-white'
          }`}
          aria-label="Next"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M8 5v14l8.5-7L8 5zm9 0h2v14h-2V5z"/>
          </svg>
        </button>

        {/* Repeat Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={cycleRepeat}
          className={`flex h-8 w-8 items-center justify-center transition-colors ${
            repeat !== 'none' ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          aria-label="Enable repeat"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 relative">
            {repeat === 'one' ? (
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/>
            ) : (
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
            )}
            {repeat !== 'none' && (
              <span className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#1db954]" />
            )}
          </svg>
        </button>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full">
        <ProgressBar audioRef={audioRef} />
      </div>
    </div>
  );
}

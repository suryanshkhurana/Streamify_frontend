/**
 * src/components/Player/index.tsx
 *
 * The main global audio player component.
 * It ties together TrackInfo, Controls, ProgressBar, VolumeControl,
 * and the HLS.js logic via useHlsPlayer.
 */

import { useRef } from 'react';
import { useHlsPlayer } from '@/hooks/useHlsPlayer';
import TrackInfo from './TrackInfo';
import Controls from './Controls';
import VolumeControl from './VolumeControl';
import { usePlayerStore } from '@/stores/playerStore';

export default function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Connect the <audio> element to our Zustand store via HLS.js
  useHlsPlayer(audioRef);

  return (
    <div className="flex h-full w-full items-center justify-between bg-black px-4">
      {/* Hidden HTML5 Audio Element */}
      <audio ref={audioRef} className="hidden" />

      {/* Left: Track Info */}
      <div className="flex flex-1 md:flex-none md:w-[30%] md:min-w-[180px] justify-start truncate pr-2 md:pr-0">
        <TrackInfo />
      </div>

      {/* Center: Controls & Progress */}
      <div className="flex max-w-[722px] flex-1 md:flex-[2] flex-col items-center justify-center px-2 md:px-4">
        <Controls audioRef={audioRef} />
      </div>

      {/* Right: Volume */}
      <div className="hidden md:flex w-[30%] min-w-[180px] justify-end">
        <VolumeControl />
      </div>

      {/* DEBUG PANEL (Keep hidden normally) */}
      <div className="pointer-events-none fixed right-0 top-0 z-50 hidden h-96 w-96 overflow-y-auto bg-black/80 p-4 font-mono text-xs text-green-400">
        <h3 className="mb-2 font-bold text-white">DEBUG INFO</h3>
        <p>isPlaying: {String(usePlayerStore.getState().isPlaying)}</p>
        <p>isLoading: {String(usePlayerStore.getState().isLoading)}</p>
        <p>currentTimeMs: {usePlayerStore.getState().currentTimeMs}</p>
        <p>durationMs: {usePlayerStore.getState().durationMs}</p>
        <p>error: {usePlayerStore.getState().error || 'none'}</p>
        <p>audioRef.current?: {audioRef.current ? 'yes' : 'no'}</p>
      </div>
    </div>
  );
}

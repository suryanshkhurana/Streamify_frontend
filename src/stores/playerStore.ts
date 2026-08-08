/**
 * src/stores/playerStore.ts
 *
 * Zustand store for the global audio player.
 *
 * State:
 *   currentTrack  — the track currently loaded/playing (or null)
 *   queue         — ordered list of tracks
 *   queueIndex    — index of currentTrack in queue
 *   isPlaying     — audio playing vs paused
 *   volume        — 0–1 (persisted to localStorage)
 *   isMuted       — true when muted
 *   currentTimeMs — current playback position in milliseconds
 *   durationMs    — total duration of current track in milliseconds
 *   shuffle       — shuffle mode on/off
 *   repeat        — 'none' | 'one' | 'all'
 *   isLoading     — true while HLS is fetching / buffering
 *   error         — last playback error message
 *
 * This store only holds data. All HLS.js interactions happen inside the
 * Player component via a custom hook (useHlsPlayer).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Silent play-count reporter ──────────────────────────────────────────────
// Fire-and-forget: we never await this, never surface errors to the user.
function reportPlay(trackId: string) {
  // Dynamic import avoids circular dep between store and axios module
  import('@/lib/axios').then(({ api }) => {
    api.post(`/catalog/tracks/${trackId}/play`).catch(() => { /* ignore */ });
  }).catch(() => { /* ignore */ });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type RepeatMode = 'none' | 'one' | 'all';

export interface PlayerTrack {
  id: string;           // track UUID (used for GET /stream/:id)
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  artworkUrl?: string;  // album art thumbnail
  durationMs?: number;  // known duration (optional — HLS may override)
}

interface PlayerState {
  // ── Playback ──────────────────────────────────────────────────────────────
  currentTrack: PlayerTrack | null;
  queue: PlayerTrack[];
  queueIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;

  // ── Timing ───────────────────────────────────────────────────────────────
  currentTimeMs: number;
  durationMs: number;

  // ── Audio ─────────────────────────────────────────────────────────────────
  volume: number;   // 0–1
  isMuted: boolean;

  // ── Queue controls ────────────────────────────────────────────────────────
  shuffle: boolean;
  repeat: RepeatMode;

  // ── Shuffle index map (internal) ──────────────────────────────────────────
  shuffledIndices: number[];
  shufflePosition: number;
}

interface PlayerActions {
  // Load a single track (clears queue)
  playTrack: (track: PlayerTrack) => void;

  // Load a queue and start at a given index
  playQueue: (tracks: PlayerTrack[], startIndex?: number) => void;

  // Transport
  setIsPlaying: (v: boolean) => void;
  setIsLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;

  // Timing (updated by the HTMLAudioElement event loop)
  setCurrentTimeMs: (ms: number) => void;
  setDurationMs: (ms: number) => void;

  // Audio
  setVolume: (v: number) => void;
  toggleMute: () => void;

  // Queue navigation
  skipNext: () => void;
  skipPrev: () => void;

  // Shuffle / Repeat
  toggleShuffle: () => void;
  setRepeat: (mode: RepeatMode) => void;
  cycleRepeat: () => void;

  // Internal
  _buildShuffleIndices: () => void;
}

export type PlayerStore = PlayerState & PlayerActions;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fisherYates(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ────────────────────────────────────────────────────
      currentTrack: null,
      queue: [],
      queueIndex: 0,
      isPlaying: false,
      isLoading: false,
      error: null,
      currentTimeMs: 0,
      durationMs: 0,
      volume: 0.8,
      isMuted: false,
      shuffle: false,
      repeat: 'none',
      shuffledIndices: [],
      shufflePosition: 0,

      // ── Actions ─────────────────────────────────────────────────────────
      playTrack: (track) => {
        reportPlay(track.id);
        set({
          currentTrack: track,
          queue: [track],
          queueIndex: 0,
          isPlaying: true,
          currentTimeMs: 0,
          durationMs: track.durationMs ?? 0,
          error: null,
          shuffledIndices: [0],
          shufflePosition: 0,
        });
      },

      playQueue: (tracks, startIndex = 0) => {
        if (tracks.length === 0) return;
        const idx = Math.min(startIndex, tracks.length - 1);
        set({
          queue: tracks,
          queueIndex: idx,
          currentTrack: tracks[idx]!,
          isPlaying: true,
          currentTimeMs: 0,
          durationMs: tracks[idx]?.durationMs ?? 0,
          error: null,
        });
        get()._buildShuffleIndices();
      },

      setIsPlaying: (v) => set({ isPlaying: v }),
      setIsLoading: (v) => set({ isLoading: v }),
      setError: (msg) => set({ error: msg, isLoading: false }),

      setCurrentTimeMs: (ms) => set({ currentTimeMs: ms }),
      setDurationMs: (ms) => set({ durationMs: ms }),

      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)), isMuted: false }),
      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

      skipNext: () => {
        const { queue, queueIndex, shuffle, shuffledIndices, shufflePosition, repeat } = get();
        if (queue.length === 0) return;

        if (repeat === 'one') {
          set({ currentTimeMs: 0 });
          return;
        }

        let nextIndex: number;

        if (shuffle) {
          const nextPos = (shufflePosition + 1) % shuffledIndices.length;
          nextIndex = shuffledIndices[nextPos] ?? 0;
          set({
            shufflePosition: nextPos,
            queueIndex: nextIndex,
            currentTrack: queue[nextIndex]!,
            currentTimeMs: 0,
            isPlaying: true,
            error: null,
          });
          return;
        }

        if (queueIndex < queue.length - 1) {
          nextIndex = queueIndex + 1;
        } else if (repeat === 'all') {
          nextIndex = 0;
        } else {
          // End of queue, no repeat
          set({ isPlaying: false });
          return;
        }

        set({
          queueIndex: nextIndex,
          currentTrack: queue[nextIndex]!,
          currentTimeMs: 0,
          durationMs: queue[nextIndex]?.durationMs ?? 0,
          isPlaying: true,
          error: null,
        });
      },

      skipPrev: () => {
        const { queue, queueIndex, currentTimeMs, shuffle, shuffledIndices, shufflePosition } = get();
        if (queue.length === 0) return;

        // If >3 s in — restart current track
        if (currentTimeMs > 3000) {
          set({ currentTimeMs: 0 });
          return;
        }

        if (shuffle) {
          const prevPos = (shufflePosition - 1 + shuffledIndices.length) % shuffledIndices.length;
          const prevIndex = shuffledIndices[prevPos] ?? 0;
          set({
            shufflePosition: prevPos,
            queueIndex: prevIndex,
            currentTrack: queue[prevIndex]!,
            currentTimeMs: 0,
            isPlaying: true,
            error: null,
          });
          return;
        }

        const prevIndex = Math.max(0, queueIndex - 1);
        set({
          queueIndex: prevIndex,
          currentTrack: queue[prevIndex]!,
          currentTimeMs: 0,
          durationMs: queue[prevIndex]?.durationMs ?? 0,
          isPlaying: true,
          error: null,
        });
      },

      toggleShuffle: () => {
        const { shuffle } = get();
        set({ shuffle: !shuffle });
        get()._buildShuffleIndices();
      },

      setRepeat: (mode) => set({ repeat: mode }),

      cycleRepeat: () => {
        const order: RepeatMode[] = ['none', 'all', 'one'];
        const { repeat } = get();
        const next = order[(order.indexOf(repeat) + 1) % order.length]!;
        set({ repeat: next });
      },

      _buildShuffleIndices: () => {
        const { queue, queueIndex } = get();
        const indices = fisherYates(queue.length);
        // Ensure current track is at position 0 of shuffled array
        const currentPos = indices.indexOf(queueIndex);
        if (currentPos !== 0) {
          [indices[0], indices[currentPos]] = [indices[currentPos]!, indices[0]!];
        }
        set({ shuffledIndices: indices, shufflePosition: 0 });
      },
    }),
    {
      name: 'streamify-player',
      // Only persist user preferences, not playback state
      partialize: (s) => ({
        volume: s.volume,
        isMuted: s.isMuted,
        shuffle: s.shuffle,
        repeat: s.repeat,
      }),
    }
  )
);

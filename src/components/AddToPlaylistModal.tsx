/**
 * src/components/AddToPlaylistModal.tsx
 *
 * A slide-up modal that lets any authenticated user add a track to one of their playlists.
 *
 * Usage:
 *   <AddToPlaylistModal trackId={id} trackTitle={title} onClose={() => setOpen(false)} />
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playlistApi } from '@/api/playlist';

interface Props {
  trackId: string;
  trackTitle: string;
  onClose: () => void;
}

export default function AddToPlaylistModal({ trackId, trackTitle, onClose }: Props) {
  const queryClient = useQueryClient();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['myPlaylists'],
    queryFn: playlistApi.getMyPlaylists,
  });

  const addMutation = useMutation({
    mutationFn: (playlistId: string) => playlistApi.addTrack(playlistId, trackId),
    onSuccess: (_data, playlistId) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      setAddedId(playlistId);
      setError(null);
      setTimeout(onClose, 900);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to add track');
    },
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md rounded-2xl bg-base-elevated border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-200 pointer-events-auto flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-lg font-bold text-white">Add to playlist</h2>
              <p className="text-sm text-text-secondary truncate max-w-[260px]">{trackTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-text-secondary hover:text-white hover:bg-base-highlight transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 overflow-y-auto">
            {error && (
              <p className="mb-3 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg p-3">
                  <div className="skeleton h-10 w-10 rounded flex-shrink-0" />
                  <div className="skeleton h-4 w-40 rounded" />
                </div>
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <p className="text-center py-6 text-text-secondary">
              You have no playlists yet. Create one from Your Library.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {playlists.map((pl) => {
                const isDone = addedId === pl.id;
                const isPending = addMutation.isPending && addMutation.variables === pl.id;
                return (
                  <button
                    key={pl.id}
                    className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all w-full
                      ${isDone ? 'bg-brand/10 border border-brand/30' : 'hover:bg-base-highlight'}
                      ${isPending ? 'opacity-60' : ''}`}
                    onClick={() => addMutation.mutate(pl.id)}
                    disabled={addMutation.isPending || !!addedId}
                  >
                    {/* Thumbnail */}
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-base-highlight flex items-center justify-center">
                      {pl.coverUrl ? (
                        <img src={pl.coverUrl} alt={pl.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-base">🎵</span>
                      )}
                    </div>

                    <span className="flex-1 truncate font-medium text-white">{pl.name}</span>

                    {isDone && (
                      <svg className="h-5 w-5 text-brand flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {isPending && (
                      <svg className="h-4 w-4 text-text-secondary animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
}

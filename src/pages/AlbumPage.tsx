/**
 * src/pages/AlbumPage.tsx
 * Full album detail page: hero header, tracklist, artist link.
 * Route: /album/:id
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/api/catalog';
import { usePlayerStore } from '@/stores/playerStore';

import AddToPlaylistModal from '@/components/AddToPlaylistModal';
import TrackContextMenu from '@/components/TrackContextMenu';
import LikeButton from '@/components/LikeButton';

function formatDuration(ms?: number) {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const playQueue = usePlayerStore((s) => s.playQueue);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const [addModal, setAddModal] = useState<{ trackId: string; title: string } | null>(null);

  const { data: album, isLoading, error } = useQuery({
    queryKey: ['album', id],
    queryFn: () => catalogApi.getAlbum(id!),
    enabled: !!id,
  });

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Album not found</h2>
          <p className="mt-2 text-text-secondary">We couldn't find this album.</p>
          <Link to="/" className="mt-4 btn-primary inline-flex">Go Home</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col animate-fade-in pb-32">
        <div className="h-72 w-full skeleton bg-base-highlight" />
        <div className="p-4 md:p-8 flex flex-col gap-4">
          <div className="skeleton h-8 w-1/3 rounded" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 h-14">
              <div className="skeleton h-10 w-10 rounded" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
              <div className="skeleton h-4 w-10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!album) return null;

  const handlePlayAll = () => {
    if (!album.tracks.length) return;
    playQueue(album.tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: album.artist?.name || 'Unknown Artist',
      artistId: album.artist?.id || '',
      album: album.title,
      artworkUrl: album.coverUrl ?? undefined,
      durationMs: t.durationMs,
    })), 0);
  };

  const totalDurationMs = album.tracks.reduce((acc, t) => acc + (t.durationMs || 0), 0);
  const totalMin = Math.floor(totalDurationMs / 60000);

  return (
    <div className="flex flex-col pb-32 animate-fade-in">
      {/* ── Hero Header ── */}
      <div className="relative flex items-center md:items-end gap-8 p-4 md:p-8 bg-gradient-to-b from-violet-900/40 to-base min-h-[320px] md:min-h-[280px]">
        {/* Blurred bg */}
        {album.coverUrl && (
          <div className="absolute inset-0 overflow-hidden">
            <img src={album.coverUrl} alt="" className="h-full w-full object-cover blur-xl opacity-20 scale-110" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base/60 to-base" />
          </div>
        )}

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 w-full text-center md:text-left pt-12 md:pt-0">
          {/* Cover */}
          <div className="h-48 w-48 md:h-52 md:w-52 flex-shrink-0 overflow-hidden rounded-xl shadow-2xl bg-base-highlight border border-border">
            {album.coverUrl ? (
              <img src={album.coverUrl} alt={album.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-5xl">💿</div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-2 mb-2 items-center md:items-start">
            <span className="text-sm font-bold uppercase tracking-widest text-text-secondary">Album</span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">{album.title}</h1>
            <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
              {album.artist && (
                <Link
                  to={`/artist/${album.artist.id}`}
                  className="font-bold text-white hover:underline"
                >
                  {album.artist.name}
                </Link>
              )}
              <span>•</span>
              <span>{album.tracks.length} songs</span>
              {totalMin > 0 && <><span>•</span><span>~{totalMin} min</span></>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Bar ── */}
      <div className="flex items-center gap-6 px-8 py-4">
        <button
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-black hover:scale-105 hover:bg-brand-hover transition-transform shadow-lg shadow-brand/20 disabled:opacity-40"
          onClick={handlePlayAll}
          disabled={!album.tracks.length}
          title="Play all"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 ml-1">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>

      {/* ── Track List ── */}
      <div className="px-8">
        {album.tracks.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">
            No tracks in this album yet.
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 px-3 py-2 text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border mb-1">
              <div className="w-6 text-center">#</div>
              <div className="flex-1">Title</div>
              <div className="w-16 text-center hidden sm:block">Duration</div>
              <div className="w-8" />
            </div>

            {album.tracks.map((track, idx) => (
              <div
                key={track.id}
                className="group flex items-center gap-4 rounded-md px-3 py-2.5 hover:bg-base-highlight transition-colors cursor-pointer"
                onClick={() => playTrack({
                  id: track.id,
                  title: track.title,
                  artist: album.artist?.name || 'Unknown Artist',
                  artistId: album.artist?.id || '',
                  album: album.title,
                  artworkUrl: album.coverUrl ?? undefined,
                  durationMs: track.durationMs,
                })}
              >
                <div className="w-6 text-center text-sm text-text-secondary group-hover:hidden">{idx + 1}</div>
                <div className="w-6 hidden text-center text-white group-hover:block">▶</div>

                <div className="flex-1 flex flex-col overflow-hidden">
                  <span className="truncate font-medium text-white group-hover:text-brand transition-colors">
                    {track.title}
                  </span>
                  <span className="text-sm text-text-secondary truncate">
                    {album.artist?.name || 'Unknown Artist'}
                    {track.playCount != null && (
                      <span className="ml-2 text-text-muted">{track.playCount.toLocaleString()} plays</span>
                    )}
                  </span>
                </div>

                <div className="w-16 text-center text-sm text-text-secondary hidden sm:block">
                  {formatDuration(track.durationMs)}
                </div>

                {/* ⋯ context button */}
                <div className="flex items-center gap-4 text-text-secondary">
                  <LikeButton trackId={track.id} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  <TrackContextMenu onAdd={() => setAddModal({ trackId: track.id, title: track.title })} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add to Playlist Modal ── */}
      {addModal && (
        <AddToPlaylistModal
          trackId={addModal.trackId}
          trackTitle={addModal.title}
          onClose={() => setAddModal(null)}
        />
      )}
    </div>
  );
}

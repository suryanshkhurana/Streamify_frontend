/**
 * src/pages/studio/StudioAlbumsPage.tsx
 *
 * Manage albums — create new albums and view existing ones.
 * Accessible at /studio/albums for artists.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { studioApi } from '@/api/studio';

const ALBUM_TYPES = ['ALBUM', 'EP', 'SINGLE'] as const;
const GENRES = ['Pop', 'Hip-Hop', 'Rock', 'Electronic', 'Jazz', 'R&B', 'Classical', 'Indie', 'Country', 'Metal', 'Bollywood', 'Lo-Fi'];

export default function StudioAlbumsPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form fields
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumType, setAlbumType] = useState<'ALBUM' | 'EP' | 'SINGLE'>('ALBUM');
  const [albumCoverUrl, setAlbumCoverUrl] = useState('');
  const [albumGenres, setAlbumGenres] = useState<string[]>([]);
  const [albumExplicit, setAlbumExplicit] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: artist } = useQuery({
    queryKey: ['myArtist'],
    queryFn: studioApi.getMyArtist,
  });

  const { data: albums = [], isLoading } = useQuery({
    queryKey: ['myAlbums', artist?.id],
    queryFn: () => studioApi.getMyAlbums(artist!.id),
    enabled: !!artist?.id,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () => studioApi.createAlbum({
      title: albumTitle.trim(),
      type: albumType,
      coverUrl: albumCoverUrl.trim() || undefined,
      genres: albumGenres,
      isExplicit: albumExplicit,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAlbums', artist?.id] });
      setIsCreating(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (albumId: string) => studioApi.deleteAlbum(albumId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAlbums', artist?.id] });
      setDeleteConfirmId(null);
    },
  });

  const resetForm = () => {
    setAlbumTitle('');
    setAlbumType('ALBUM');
    setAlbumCoverUrl('');
    setAlbumGenres([]);
    setAlbumExplicit(false);
  };

  const toggleGenre = (genre: string) => {
    setAlbumGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre].slice(0, 5)
    );
  };

  return (
    <div className="flex flex-col gap-8 p-8 pb-32 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/studio" className="text-sm text-text-secondary hover:text-white transition-colors mb-1 inline-flex items-center gap-1">
            ← Back to Studio
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mt-1">My Albums</h1>
          <p className="mt-1 text-text-secondary">Create and manage your discography.</p>
        </div>
        {!isCreating && (
          <button className="btn-primary" onClick={() => setIsCreating(true)}>
            + Create Album
          </button>
        )}
      </div>

      {/* ── Create Album Form ── */}
      {isCreating && (
        <div className="rounded-2xl border border-brand/30 bg-base-elevated p-6 flex flex-col gap-5 shadow-lg shadow-brand/5">
          <h2 className="text-xl font-bold text-white">New Album</h2>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              Album Title <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              className="input-base"
              placeholder="e.g. Midnight Sessions"
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
              autoFocus
              maxLength={300}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">Release Type</label>
            <div className="flex gap-3">
              {ALBUM_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAlbumType(type)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold border transition-all ${
                    albumType === type
                      ? 'bg-brand border-brand text-black'
                      : 'bg-transparent border-border text-text-secondary hover:border-white hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Cover URL */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">Cover Image URL (optional)</label>
            <input
              type="url"
              className="input-base"
              placeholder="https://example.com/cover.jpg"
              value={albumCoverUrl}
              onChange={(e) => setAlbumCoverUrl(e.target.value)}
            />
            <p className="mt-1 text-xs text-text-muted">Paste a public image URL. Album art upload UI coming soon.</p>
          </div>

          {/* Genres */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              Genres <span className="text-text-muted">(up to 5)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition-all ${
                    albumGenres.includes(genre)
                      ? 'bg-brand text-black'
                      : 'bg-base-highlight text-text-secondary hover:text-white'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Explicit toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Explicit Content</p>
              <p className="text-sm text-text-secondary">Contains explicit language or themes.</p>
            </div>
            <button
              type="button"
              onClick={() => setAlbumExplicit((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                albumExplicit ? 'bg-brand' : 'bg-base-highlight'
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${albumExplicit ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Error */}
          {createMutation.isError && (
            <p className="text-sm text-red-400">
              {(createMutation.error as Error)?.message || 'Failed to create album.'}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={!albumTitle.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Creating…' : 'Create Album'}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => { setIsCreating(false); resetForm(); }}
              disabled={createMutation.isPending}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Albums Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="skeleton aspect-square w-full rounded-xl" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl">
          <span className="text-6xl mb-4">💿</span>
          <h3 className="text-xl font-bold text-white mb-2">No albums yet</h3>
          <p className="text-text-secondary mb-6 max-w-sm">
            Create an album to organise your tracks. Albums appear on your artist profile page.
          </p>
          <button className="btn-primary" onClick={() => setIsCreating(true)}>
            Create your first album
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {albums.map((album) => (
            <div
              key={album.id}
              className="group relative flex flex-col gap-3 rounded-xl bg-base-elevated p-4 hover:bg-base-highlight transition-all border border-border hover:border-border/60"
            >
              {/* Cover */}
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-base-highlight shadow-md">
                {album.coverUrl ? (
                  <img src={album.coverUrl} alt={album.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl text-text-secondary">💿</div>
                )}

                {/* Delete button */}
                {deleteConfirmId === album.id ? (
                  <div className="absolute inset-0 bg-base/90 flex flex-col items-center justify-center gap-2 p-2">
                    <p className="text-xs text-white text-center font-semibold">Delete this album?</p>
                    <div className="flex gap-2">
                      <button
                        className="rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white hover:bg-red-400"
                        onClick={() => deleteMutation.mutate(album.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </button>
                      <button
                        className="rounded-md bg-base-highlight px-2 py-1 text-xs text-white"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 rounded-full bg-black/60 p-1.5 text-text-secondary hover:text-red-400 transition-all"
                    onClick={() => setDeleteConfirmId(album.id)}
                    title="Delete album"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Info */}
              <div>
                <h3 className="truncate font-bold text-white leading-tight">{album.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{album.type}</span>
                  {album.isExplicit && (
                    <span className="text-[10px] font-bold bg-base-highlight text-text-secondary px-1 rounded">E</span>
                  )}
                </div>
                {album.genres.length > 0 && (
                  <p className="text-xs text-text-muted mt-1 truncate">{album.genres.slice(0, 2).join(' · ')}</p>
                )}
              </div>

              {/* Upload track to this album */}
              <Link
                to={`/studio/upload?albumId=${album.id}`}
                className="mt-1 text-xs font-semibold text-brand hover:text-brand-hover transition-colors"
              >
                + Upload track to this album
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * SearchPage.tsx — Spotify-like search with:
 *  - Live typeahead dropdown as you type
 *  - Full results page with tracks, artists, albums sections
 *  - "Browse by genre" grid when idle
 *  - Trending searches from Redis
 *  - Add to playlist on every track
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/api/search';
import { usePlayerStore } from '@/stores/playerStore';
import { Link } from 'react-router-dom';

import AddToPlaylistModal from '@/components/AddToPlaylistModal';
import TrackContextMenu from '@/components/TrackContextMenu';
import LikeButton from '@/components/LikeButton';
import { api } from '@/lib/axios';

const GENRES = [
  { name: 'Pop', color: 'from-pink-600 to-rose-500', emoji: '🎤' },
  { name: 'Hip-Hop', color: 'from-orange-600 to-amber-500', emoji: '🎧' },
  { name: 'Rock', color: 'from-red-700 to-red-500', emoji: '🎸' },
  { name: 'Electronic', color: 'from-blue-600 to-cyan-500', emoji: '⚡' },
  { name: 'Jazz', color: 'from-teal-600 to-emerald-500', emoji: '🎷' },
  { name: 'Classical', color: 'from-indigo-600 to-purple-500', emoji: '🎻' },
  { name: 'R&B', color: 'from-purple-600 to-pink-500', emoji: '💜' },
  { name: 'Indie', color: 'from-green-600 to-lime-500', emoji: '🌿' },
  { name: 'Country', color: 'from-yellow-600 to-amber-400', emoji: '🤠' },
  { name: 'Metal', color: 'from-slate-700 to-zinc-600', emoji: '🤘' },
];

function formatDuration(ms?: number) {
  if (!ms) return '';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(''); // the query that was actually searched
  const [showDropdown, setShowDropdown] = useState(false);
  const [addModal, setAddModal] = useState<{ trackId: string; title: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const playTrack = usePlayerStore((s) => s.playTrack);


  // Debounced query for typeahead — 300ms
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Typeahead suggestions ──
  const { data: suggestions, isFetching: loadingSuggestions } = useQuery({
    queryKey: ['suggest', debouncedQuery],
    queryFn: () => searchApi.getSearchSuggestions(debouncedQuery),
    enabled: debouncedQuery.length >= 2 && showDropdown,
    staleTime: 30_000,
  });

  // ── Full results ──
  const { data: results, isFetching: loadingResults } = useQuery({
    queryKey: ['search', submitted],
    queryFn: () => searchApi.getSearchResults(submitted),
    enabled: submitted.length >= 1,
    staleTime: 60_000,
  });

  // ── Trending ──
  const { data: trending = [] } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/search/trending');
        return (data.data || []) as string[];
      } catch { return [] as string[]; }
    },
    staleTime: 60_000,
  });

  const handleSubmit = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSubmitted(trimmed);
    setShowDropdown(false);
  }, []);

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(query);
  };

  const hasSuggestions =
    (suggestions?.tracks?.length || 0) +
    (suggestions?.artists?.length || 0) +
    (suggestions?.albums?.length || 0) > 0;

  const hasResults =
    (results?.tracks?.length || 0) +
    (results?.artists?.length || 0) +
    (results?.albums?.length || 0) > 0;

  // ── Shared track row ──
  const TrackRow = ({ track, idx }: { track: any; idx?: number }) => {
    const artistName = track.artistName || track.artist?.name || '';
    const artistId = track.artistId || track.artist?.id || '';
    const albumTitle = track.albumTitle || track.album?.title || '';
    const cover = track.coverUrl || track.album?.coverUrl || '';

    return (
      <div
        className="group flex cursor-pointer items-center gap-4 rounded-lg p-2.5 hover:bg-base-highlight transition-colors"
        onClick={() =>
          playTrack({
            id: track.id,
            title: track.title,
            artist: artistName,
            artistId: artistId,
            album: albumTitle,
            artworkUrl: cover || undefined,
            durationMs: track.durationMs,
          })
        }
      >
        {idx !== undefined && (
          <>
            <div className="w-5 text-center text-sm text-text-secondary group-hover:hidden flex-shrink-0">
              {idx + 1}
            </div>
            <div className="hidden w-5 text-center text-white group-hover:block flex-shrink-0">▶</div>
          </>
        )}
        {idx === undefined && (
          <div className="w-5 flex-shrink-0 flex items-center justify-center">
            <span className="group-hover:hidden text-text-muted">▶</span>
            <span className="hidden group-hover:block text-white">▶</span>
          </div>
        )}

        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-base-elevated shadow-sm">
          {cover ? (
            <img src={cover} alt={track.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-text-secondary bg-base-highlight">♫</div>
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <span className="truncate text-sm font-semibold text-white group-hover:text-brand transition-colors">
            {track.title}
          </span>
          <div className="flex items-center gap-1">
            {artistId ? (
              <Link
                to={`/artist/${artistId}`}
                className="truncate text-xs text-text-secondary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {artistName}
              </Link>
            ) : (
              <span className="truncate text-xs text-text-secondary">{artistName}</span>
            )}
            {albumTitle && <span className="text-xs text-text-muted truncate">• {albumTitle}</span>}
          </div>
        </div>

        {track.durationMs && (
          <span className="text-xs text-text-secondary hidden sm:block flex-shrink-0">
            {formatDuration(track.durationMs)}
          </span>
        )}
        <div className="flex items-center gap-4 text-text-secondary">
          <LikeButton trackId={track.id} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          <TrackContextMenu onAdd={() => setAddModal({ trackId: track.id, title: track.title })} />
        </div>
      </div>
    );
  };

  // ── Artist card ──
  const ArtistCard = ({ artist }: { artist: any }) => (
    <Link
      to={`/artist/${artist.id}`}
      className="group flex flex-col items-center gap-3 rounded-xl bg-base-elevated p-4 hover:bg-base-highlight transition-all border border-border"
    >
      <div className="h-20 w-20 overflow-hidden rounded-full bg-base-highlight shadow-lg ring-2 ring-border group-hover:ring-brand transition-all">
        {artist.avatarUrl ? (
          <img src={artist.avatarUrl} alt={artist.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">🎤</div>
        )}
      </div>
      <div className="text-center">
        <p className="font-bold text-white text-sm max-w-[120px]">{artist.name}</p>
        <p className="text-xs text-text-secondary mt-0.5">Artist</p>
      </div>
    </Link>
  );

  // ── Album card ──
  const AlbumCard = ({ album }: { album: any }) => {
    const artistName = album.artistName || album.artist?.name || '';
    return (
      <Link
        to={`/album/${album.id}`}
        className="group flex flex-col gap-3 rounded-xl bg-base-elevated p-3 hover:bg-base-highlight transition-all border border-border"
      >
        <div className="relative aspect-square overflow-hidden rounded-lg shadow-md bg-base-highlight flex items-center justify-center">
          <span className="text-3xl absolute text-text-secondary">💿</span>
          {album.coverUrl && (
            <img
              src={album.coverUrl}
              alt={album.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-300 relative z-10 bg-base-elevated"
              onError={(e) => {
                e.currentTarget.style.opacity = '0';
              }}
            />
          )}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-black shadow-lg">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
        <div>
          <p className="font-bold text-white text-sm truncate">{album.title}</p>
          {artistName && <p className="text-xs text-text-secondary truncate mt-0.5">{artistName}</p>}
        </div>
      </Link>
    );
  };

  return (
    <div className="flex flex-col gap-4 md:gap-8 p-4 md:p-8 pb-32 animate-fade-in">
      {/* ── Header ── */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Search</h1>
        <p className="mt-1 text-text-secondary">Find songs, artists, and albums</p>
      </div>

      {/* ── Search Input ── */}
      <div className="relative max-w-2xl z-20" ref={dropdownRef}>
        <form onSubmit={onFormSubmit}>
          <div className="relative flex items-center">
            <svg className="absolute left-4 h-5 w-5 text-text-muted pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              id="search-input"
              placeholder="What do you want to listen to?"
              className="w-full rounded-full bg-base-elevated border border-border pl-12 pr-4 py-3.5 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all text-base shadow-md"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => query.length >= 2 && setShowDropdown(true)}
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setSubmitted(''); setShowDropdown(false); }}
                className="absolute right-4 text-text-muted hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </form>

        {/* ── Typeahead Dropdown ── */}
        {showDropdown && debouncedQuery.length >= 2 && (
          <div className="absolute top-full left-0 mt-2 w-full max-h-[420px] overflow-y-auto rounded-xl bg-base-elevated border border-border shadow-2xl p-3 animate-in fade-in slide-in-from-top-1 duration-150">
            {loadingSuggestions ? (
              <div className="flex items-center gap-3 p-3 text-text-secondary">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Searching…
              </div>
            ) : hasSuggestions ? (
              <div className="flex flex-col gap-4">
                {/* Press Enter prompt */}
                <button
                  className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-base-highlight text-left transition-colors w-full"
                  onClick={() => handleSubmit(debouncedQuery)}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-base-highlight text-brand flex-shrink-0">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                    </svg>
                  </div>
                  <span className="font-medium text-white">
                    Search for "<span className="text-brand">{debouncedQuery}</span>"
                  </span>
                </button>

                {/* Tracks */}
                {(suggestions?.tracks?.length ?? 0) > 0 && (
                  <div>
                    <p className="px-2.5 pb-1 text-xs font-bold uppercase tracking-wider text-text-secondary">Songs</p>
                    {suggestions!.tracks.slice(0, 4).map((t: any) => (
                      <div
                        key={t.id}
                        className="group flex cursor-pointer items-center gap-3 rounded-lg p-2.5 hover:bg-base-highlight transition-colors"
                        onClick={() => {
                          const cover = t.coverUrl || t.album?.coverUrl || '';
                          playTrack({
                            id: t.id,
                            title: t.title,
                            artist: t.artistName || t.artist?.name || '',
                            artistId: t.artistId || t.artist?.id || '',
                            artworkUrl: cover || undefined,
                            durationMs: t.durationMs,
                          });
                          setShowDropdown(false);
                        }}
                      >
                        <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded bg-base-highlight">
                          {(t.coverUrl || t.album?.coverUrl) ? (
                            <img src={t.coverUrl || t.album?.coverUrl} alt={t.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-text-secondary">♫</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-white group-hover:text-brand transition-colors">{t.title}</p>
                          <p className="truncate text-xs text-text-secondary">{t.artistName || t.artist?.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Artists */}
                {(suggestions?.artists?.length ?? 0) > 0 && (
                  <div>
                    <p className="px-2.5 pb-1 text-xs font-bold uppercase tracking-wider text-text-secondary">Artists</p>
                    {suggestions!.artists.slice(0, 3).map((a: any) => (
                      <Link
                        key={a.id}
                        to={`/artist/${a.id}`}
                        className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-base-highlight transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-base-highlight">
                          {a.avatarUrl ? (
                            <img src={a.avatarUrl} alt={a.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm">🎤</div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{a.name}</p>
                          <p className="text-xs text-text-secondary">Artist</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="p-3 text-sm text-text-secondary">No results for "{debouncedQuery}"</p>
            )}
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      {submitted ? (
        // ── Search Results ──
        <div className="animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Results for <span className="text-brand">"{submitted}"</span>
            </h2>
            {loadingResults && (
              <svg className="h-5 w-5 animate-spin text-text-secondary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
          </div>

          {loadingResults ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 flex flex-col gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 h-14 px-2.5">
                    <div className="skeleton h-10 w-10 rounded flex-shrink-0" />
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="skeleton h-4 w-40 rounded" />
                      <div className="skeleton h-3 w-28 rounded" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))}
              </div>
            </div>
          ) : !hasResults ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
              <p className="text-text-secondary">
                Try different keywords or check your spelling
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Tracks */}
              <div className="lg:col-span-2 flex flex-col gap-1">
                {(results?.tracks?.length ?? 0) > 0 && (
                  <>
                    <h3 className="mb-3 text-lg font-bold text-white">Songs</h3>
                    {results!.tracks.map((t: any, i: number) => (
                      <TrackRow key={t.id} track={t} idx={i} />
                    ))}
                  </>
                )}
              </div>

              {/* Right: Artists + Albums */}
              <div className="flex flex-col gap-8">
                {/* Top Result (first artist or album) */}
                {(results?.artists?.length ?? 0) > 0 && (() => {
                  const a = results!.artists[0];
                  return (
                    <div>
                      <h3 className="mb-3 text-lg font-bold text-white">Top Result</h3>
                      <Link
                        to={`/artist/${a.id}`}
                        className="flex flex-col gap-4 rounded-xl bg-base-elevated p-6 hover:bg-base-highlight transition-all border border-border group"
                      >
                        <div className="h-24 w-24 overflow-hidden rounded-full bg-base-highlight shadow-2xl ring-2 ring-border group-hover:ring-brand transition-all">
                          {a.avatarUrl ? (
                            <img src={a.avatarUrl} alt={a.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-4xl">🎤</div>
                          )}
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{a.name}</p>
                          <span className="mt-1 inline-block rounded-full bg-base-highlight px-2 py-0.5 text-xs text-text-secondary">Artist</span>
                        </div>
                      </Link>
                    </div>
                  );
                })()}

                {/* More Artists */}
                {(results?.artists?.length ?? 0) > 1 && (
                  <div>
                    <h3 className="mb-3 text-lg font-bold text-white">Artists</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {results!.artists.slice(1).map((a: any) => (
                        <ArtistCard key={a.id} artist={a} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Albums */}
                {(results?.albums?.length ?? 0) > 0 && (
                  <div>
                    <h3 className="mb-3 text-lg font-bold text-white">Albums</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {results!.albums.map((al: any) => (
                        <AlbumCard key={al.id} album={al} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        // ── Idle: Trending + Browse Genres ──
        <div className="flex flex-col gap-10">
          {/* Trending searches */}
          {trending.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold text-white">Trending Searches</h2>
              <div className="flex flex-wrap gap-2">
                {trending.map((t) => (
                  <button
                    key={t}
                    className="rounded-full bg-base-elevated border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:text-white hover:border-brand hover:bg-base-highlight transition-all"
                    onClick={() => { setQuery(t); handleSubmit(t); }}
                  >
                    🔥 {t}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Browse by genre */}
          <section>
            <h2 className="mb-6 text-2xl font-bold text-white">Browse by genre</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {GENRES.map((genre) => (
                <button
                  key={genre.name}
                  className={`relative flex h-36 cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br ${genre.color} p-4 text-left transition-transform hover:scale-105 active:scale-95 shadow-lg`}
                  onClick={() => { setQuery(genre.name); handleSubmit(genre.name); }}
                >
                  <span className="text-xl font-extrabold text-white leading-tight drop-shadow-lg">
                    {genre.name}
                  </span>
                  <span className="absolute -bottom-2 -right-2 text-6xl opacity-40 rotate-12 select-none">
                    {genre.emoji}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

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

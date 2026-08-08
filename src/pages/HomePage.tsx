import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/api/catalog';
import { userApi } from '@/api/user';
import { usePlayerStore } from '@/stores/playerStore';
import { Link } from 'react-router-dom';
import AddToPlaylistModal from '@/components/AddToPlaylistModal';
import TrackContextMenu from '@/components/TrackContextMenu';
import LikeButton from '@/components/LikeButton';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomePage() {
  const [addModal, setAddModal] = useState<{ trackId: string; title: string } | null>(null);

  const { data: topTracks = [], isLoading: loadingTopTracks } = useQuery({
    queryKey: ['topTracks'],
    queryFn: catalogApi.getTopTracks,
  });

  const { data: newReleases = [], isLoading: loadingReleases } = useQuery({
    queryKey: ['newReleases'],
    queryFn: catalogApi.getNewReleases,
  });


  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['listeningHistory'],
    queryFn: () => userApi.getHistory(10),
  });

  const playTrack = usePlayerStore((s) => s.playTrack);


  return (
    <div className="flex flex-col gap-8 md:gap-10 p-4 md:p-8 animate-fade-in pb-32">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">{getGreeting()}</h1>
        <p className="mt-2 text-text-secondary">Welcome back to Streamify</p>
      </div>

      {/* ── Recently Played ── */}
      {(loadingHistory || history.length > 0) && (
        <section>
          <h2 className="mb-6 text-2xl font-bold text-white tracking-tight">Recently Played</h2>
          <div className="flex flex-col gap-1">
            {loadingHistory
              ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex h-14 items-center gap-4 rounded-md p-2">
                  <div className="skeleton h-10 w-10 rounded flex-shrink-0" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="skeleton h-4 w-48 rounded" />
                    <div className="skeleton h-3 w-32 rounded" />
                  </div>
                </div>
              ))
              : history.slice(0, 6).map((entry) => {
                const t = entry.track;
                if (!t) return null;
                return (
                  <div
                    key={entry.id}
                    className="group flex cursor-pointer items-center gap-4 rounded-md p-2 transition-colors hover:bg-base-highlight"
                    onClick={() => playTrack({
                      id: t.id,
                      title: t.title,
                      artist: t.artist.name,
                      artistId: t.artist.id,
                      album: t.album?.title,
                      artworkUrl: t.album?.coverUrl ?? undefined,
                      durationMs: t.durationMs,
                    })}
                  >
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-base-elevated shadow-sm">
                      {t.album?.coverUrl ? (
                        <img src={t.album.coverUrl} alt={t.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-text-secondary">♫</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col overflow-hidden">
                      <span className="truncate font-medium text-white group-hover:text-brand transition-colors">{t.title}</span>
                      <Link
                        to={`/artist/${t.artist.id}`}
                        className="truncate text-sm text-text-secondary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t.artist.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <LikeButton trackId={t.id} />
                      <TrackContextMenu onAdd={() => setAddModal({ trackId: t.id, title: t.title })} />
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* ── Most Popular ── */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Most Popular</h2>
            <Link to="/discover" className="mt-1 text-sm text-text-secondary hover:text-white hover:underline transition-colors block">
              Go to discover page to browse more songs
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {loadingTopTracks
            ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex h-16 items-center gap-4 rounded-md p-2">
                <div className="skeleton h-12 w-12 rounded" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="skeleton h-4 w-48 rounded" />
                  <div className="skeleton h-3 w-32 rounded" />
                </div>
              </div>
            ))
            : topTracks.map((track, index) => (
              <div
                key={track.id}
                className="group flex cursor-pointer items-center gap-4 rounded-md p-2 transition-colors hover:bg-base-highlight"
                onClick={() => playTrack({
                  id: track.id,
                  title: track.title,
                  artist: track.artist.name,
                  artistId: track.artist.id,
                  album: track.album?.title,
                  artworkUrl: track.album?.coverUrl ?? undefined,
                  durationMs: track.durationMs,
                })}
              >
                <div className="flex w-6 justify-center text-text-secondary group-hover:hidden">{index + 1}</div>
                <div className="hidden w-6 justify-center text-white group-hover:flex">▶</div>
                <div className="h-12 w-12 overflow-hidden rounded shadow-sm flex-shrink-0 bg-base-elevated">
                  {track.album?.coverUrl ? (
                    <img src={track.album.coverUrl} alt={track.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-base-highlight text-xs text-text-secondary">♫</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span className="truncate font-medium text-white group-hover:text-brand transition-colors">{track.title}</span>
                  {track.artist && (
                    <Link to={`/artist/${track.artist.id}`} className="truncate text-sm text-text-secondary hover:underline" onClick={(e) => e.stopPropagation()}>
                      {track.artist.name}
                    </Link>
                  )}
                </div>
                {track.playCount != null && (
                  <span className="text-xs text-text-secondary hidden sm:block w-24 text-right">
                    {Number(track.playCount).toLocaleString()} plays
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <LikeButton trackId={track.id} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  <TrackContextMenu onAdd={() => setAddModal({ trackId: track.id, title: track.title })} />
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* ── New Releases ── */}
      <section>
        <h2 className="mb-6 text-2xl font-bold text-white tracking-tight">New Releases</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {loadingReleases
            ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card group flex flex-col gap-4">
                <div className="skeleton aspect-square w-full rounded-md" />
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
              </div>
            ))
            : newReleases.slice(0, 5).map((album) => (
              <Link
                key={album.id}
                to={`/album/${album.id}`}
                className="group relative flex cursor-pointer flex-col gap-4 overflow-hidden bg-base-elevated p-4 transition-all hover:bg-base-highlight hover:shadow-xl rounded-xl"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-md shadow-md bg-base-highlight flex items-center justify-center">
                  <span className="text-4xl absolute text-text-secondary">💿</span>
                  {album.coverUrl && (
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 relative z-10 bg-base-elevated"
                      onError={(e) => {
                        e.currentTarget.style.opacity = '0';
                      }}
                    />
                  )}
                  <div className="absolute bottom-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-black shadow-lg">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 ml-0.5"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="truncate font-bold text-white">{album.title}</h3>
                  {album.artist && <p className="mt-1 truncate text-sm text-text-secondary">{album.artist.name}</p>}
                </div>
              </Link>
            ))}
        </div>
      </section>

      {addModal && (
        <AddToPlaylistModal trackId={addModal.trackId} trackTitle={addModal.title} onClose={() => setAddModal(null)} />
      )}
    </div>
  );
}

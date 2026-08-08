import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/api/catalog';
import { userApi } from '@/api/user';
import { usePlayerStore } from '@/stores/playerStore';
import { Link } from 'react-router-dom';

import AddToPlaylistModal from '@/components/AddToPlaylistModal';
import TrackContextMenu from '@/components/TrackContextMenu';
import LikeButton from '@/components/LikeButton';

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const playTrack = usePlayerStore((s) => s.playTrack);

  const [addModal, setAddModal] = useState<{ trackId: string; title: string } | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const { data: artist, isLoading: loadingArtist, error: artistError } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => catalogApi.getArtist(id!),
    enabled: !!id,
  });

  const { data: topTracks = [], isLoading: loadingTracks } = useQuery({
    queryKey: ['artistTopTracks', id],
    queryFn: () => catalogApi.getArtistTopTracks(id!),
    enabled: !!id,
  });

  const { data: albums = [], isLoading: loadingAlbums } = useQuery({
    queryKey: ['artistAlbums', id],
    queryFn: () => catalogApi.getArtistAlbums(id!),
    enabled: !!id,
  });

  if (artistError) {
    return (
      <div className="flex h-full items-center justify-center p-8 animate-fade-in">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Artist not found</h2>
          <p className="mt-2 text-text-secondary">We couldn't find the artist you're looking for.</p>
        </div>
      </div>
    );
  }

  if (loadingArtist) {
    return (
      <div className="flex flex-col animate-fade-in pb-32">
        <div className="h-64 w-full skeleton bg-base-highlight" />
        <div className="p-8">
          <div className="h-10 w-1/3 skeleton rounded-md mb-8" />
          <div className="h-40 w-full skeleton rounded-md" />
        </div>
      </div>
    );
  }

  if (!artist) return null;

  return (
    <div className="flex flex-col pb-32 animate-fade-in">
      {/* Hero Header */}
      <div className="relative flex min-h-[320px] md:h-80 flex-col justify-end bg-gradient-to-b from-primary/30 to-base p-4 md:p-8">
        <div className="absolute inset-0 z-0 opacity-20">
          {artist.coverUrl || artist.avatarUrl ? (
            <img
              src={artist.coverUrl || artist.avatarUrl!}
              alt=""
              className="h-full w-full object-cover blur-sm"
            />
          ) : (
            <div className="h-full w-full bg-base-highlight" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-base to-transparent z-10" />

        <div className="relative z-20 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left pt-12 md:pt-0">
          <div className="h-48 w-48 overflow-hidden rounded-full shadow-2xl bg-base-highlight flex-shrink-0 border-4 border-base">
            {artist.avatarUrl ? (
              <img src={artist.avatarUrl} alt={artist.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl text-text-secondary">
                🎤
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 mb-2 flex-1 items-center md:items-start">
            <span className="text-sm font-bold uppercase tracking-widest text-text-secondary">Artist</span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white">{artist.name}</h1>
            {artist.bio && <p className="text-text-secondary max-w-2xl line-clamp-2 mt-2">{artist.bio}</p>}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 flex flex-col gap-10">
        {/* Action Bar */}
        <div className="flex items-center gap-6">
          <button
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-black transition-transform hover:scale-105 hover:bg-primary-hover shadow-lg shadow-primary/20"
            onClick={() => {
              if (topTracks.length > 0) {
                const t = topTracks[0];
                playTrack({
                  id: t.id,
                  title: t.title,
                  artist: t.artist.name,
                  artistId: t.artist.id,
                  album: t.album?.title,
                  artworkUrl: t.album?.coverUrl ?? undefined,
                  durationMs: t.durationMs
                });
              }
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <button
            className="rounded-full border border-border px-5 py-2 text-sm font-bold transition-all"
            style={isFollowing ? { background: 'white', color: 'black', borderColor: 'white' } : { color: 'white' }}
            onClick={() => {
              if (!id) return;
              if (isFollowing) {
                userApi.unfollow(id).catch(() => { });
                setIsFollowing(false);
              } else {
                userApi.follow(id).catch(() => { });
                setIsFollowing(true);
              }
            }}
          >
            {isFollowing ? 'Following ✓' : 'Follow'}
          </button>
        </div>

        {/* Popular Tracks */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-white tracking-tight">Popular</h2>
          <div className="flex flex-col">
            {loadingTracks ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex h-16 items-center gap-4 rounded-md p-2">
                  <div className="skeleton h-10 w-10 rounded" />
                  <div className="skeleton h-4 w-1/3 rounded" />
                </div>
              ))
            ) : topTracks.length > 0 ? (
              topTracks.slice(0, 5).map((track, index) => (
                <div
                  key={track.id}
                  className="group flex cursor-pointer items-center gap-4 rounded-md p-2 hover:bg-base-highlight transition-colors"
                  onClick={() => playTrack({
                    id: track.id,
                    title: track.title,
                    artist: track.artist.name,
                    artistId: track.artist.id,
                    album: track.album?.title,
                    artworkUrl: track.album?.coverUrl ?? undefined,
                    durationMs: track.durationMs
                  })}
                >
                  <div className="flex w-6 justify-center text-text-secondary group-hover:hidden">{index + 1}</div>
                  <div className="hidden w-6 justify-center text-white group-hover:flex">▶</div>
                  <div className="h-10 w-10 overflow-hidden rounded bg-base-elevated flex-shrink-0">
                    {track.album?.coverUrl ? (
                      <img src={track.album.coverUrl} alt={track.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-text-secondary">♫</div>
                    )}
                  </div>
                  <div className="flex-1 truncate font-medium text-white group-hover:text-brand transition-colors">{track.title}</div>
                  <div className="text-sm text-text-secondary hidden sm:block">
                    {track.playCount ? track.playCount.toLocaleString() : '—'}
                  </div>
                  <div className="flex items-center gap-4 text-text-secondary">
                    <LikeButton trackId={track.id} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    <TrackContextMenu onAdd={() => setAddModal({ trackId: track.id, title: track.title })} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-text-secondary">No tracks available.</p>
            )}
          </div>
        </section>

        {/* Discography */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-white tracking-tight">Discography</h2>
          {loadingAlbums ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="card flex flex-col gap-4">
                  <div className="skeleton aspect-square w-full rounded-md" />
                  <div className="skeleton h-4 w-3/4 rounded" />
                </div>
              ))}
            </div>
          ) : albums.length > 0 ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {albums.map((album) => (
                <Link
                  key={album.id}
                  to={`/album/${album.id}`}
                  className="group relative flex cursor-pointer flex-col gap-4 overflow-hidden bg-base-elevated p-4 transition-all hover:bg-base-highlight hover:shadow-xl rounded-xl border border-border"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-md shadow-md">
                    {album.coverUrl ? (
                      <img src={album.coverUrl} alt={album.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-base-highlight text-text-secondary">💿</div>
                    )}
                    <div className="absolute bottom-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-black shadow-lg">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 ml-0.5"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="truncate font-bold text-white">{album.title}</h3>
                    <span className="mt-1 block text-sm text-text-secondary">Album</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary">No albums available.</p>
          )}
        </section>
      </div>

      {addModal && (
        <AddToPlaylistModal trackId={addModal.trackId} trackTitle={addModal.title} onClose={() => setAddModal(null)} />
      )}
    </div>
  );
}

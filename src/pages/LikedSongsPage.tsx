import { Link } from 'react-router-dom';
import { usePlayerStore } from '@/stores/playerStore';
import { useAuthStore } from '@/stores/authStore';
import LikeButton from '@/components/LikeButton';
import TrackContextMenu from '@/components/TrackContextMenu';
import { useState } from 'react';
import AddToPlaylistModal from '@/components/AddToPlaylistModal';
import { useLikedSongs } from '@/hooks/useLikedSongs';

export default function LikedSongsPage() {
  const { likedTracks, totalLiked, isLoading, toggleLike } = useLikedSongs();
  const playQueue = usePlayerStore((s) => s.playQueue);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const user = useAuthStore((s) => s.user);
  const [addModal, setAddModal] = useState<{ trackId: string; title: string } | null>(null);

  if (isLoading) {
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

  const handlePlayAll = () => {
    if (likedTracks.length === 0) return;

    const playerTracks = likedTracks.map((l) => ({
      id: l.track!.id,
      title: l.track!.title,
      artist: l.track!.artist.name,
      artistId: l.track!.artist.id,
      album: l.track!.album?.title,
      artworkUrl: l.track!.album?.coverUrl ?? undefined,
      durationMs: l.track!.durationMs,
    }));

    playQueue(playerTracks, 0);
  };

  return (
    <div className="flex flex-col pb-32 animate-fade-in">
      {/* Hero Header */}
      <div className="relative flex min-h-[320px] md:h-80 flex-col justify-end bg-gradient-to-b from-indigo-800 to-base p-4 md:p-8">
        <div className="absolute inset-0 bg-gradient-to-t from-base to-transparent z-10" />

        <div className="relative z-20 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left pt-12 md:pt-0">
          <div className="h-48 w-48 overflow-hidden rounded-md shadow-2xl bg-gradient-to-br from-indigo-600 to-purple-800 flex-shrink-0 border border-border flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="h-20 w-20">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div className="flex flex-col gap-2 mb-2 flex-1 items-center md:items-start">
            <span className="text-sm font-bold uppercase tracking-widest text-text-secondary">
              Playlist
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white">Liked Songs</h1>
            <div className="text-sm font-medium text-text-secondary mt-2">
              {user?.displayName || 'User'} • {totalLiked} songs
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 flex flex-col gap-10">
        {/* Action Bar */}
        <div className="flex items-center gap-4">
          <button
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-black transition-transform hover:scale-105 hover:bg-brand-hover shadow-lg shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handlePlayAll}
            disabled={likedTracks.length === 0}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>

        {/* Tracks List */}
        <section>
          {likedTracks.length === 0 ? (
            <div className="text-center py-12 border-t border-border mt-4">
              <h3 className="text-xl font-bold text-white mb-2">No liked songs yet</h3>
              <p className="text-text-secondary mb-4">Tap the heart on any track to add it here.</p>
              <Link to="/search" className="btn-primary inline-flex">Go to Search</Link>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Header row */}
              <div className="flex items-center gap-4 p-2 text-sm font-bold text-text-secondary border-b border-border mb-2 uppercase tracking-wider">
                <div className="w-6 text-center">#</div>
                <div className="flex-1">Title</div>
                <div className="w-48 hidden md:block">Album</div>
                <div className="w-32 hidden sm:block">Date added</div>
                <div className="w-20"></div>
              </div>

              {likedTracks.map((l, index) => {
                if (!l.track) return null;
                const track = l.track;
                return (
                  <div
                    key={l.id}
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
                    <div className="flex w-6 justify-center text-text-secondary group-hover:hidden">
                      {index + 1}
                    </div>
                    <div className="hidden w-6 justify-center text-white group-hover:flex">
                      ▶
                    </div>

                    <div className="flex flex-1 items-center gap-4 overflow-hidden">
                      <div className="h-10 w-10 overflow-hidden rounded bg-base-elevated flex-shrink-0 shadow-sm">
                        {track.album?.coverUrl ? (
                          <img src={track.album?.coverUrl} alt={track.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-text-secondary">♫</div>
                        )}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate font-medium text-brand">
                          {track.title}
                        </span>
                        <Link
                          to={`/artist/${track.artist.id}`}
                          className="truncate text-sm text-text-secondary hover:text-white hover:underline block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {track.artist.name}
                        </Link>
                      </div>
                    </div>

                    <div className="w-48 hidden md:block truncate text-sm text-text-secondary hover:text-white transition-colors">
                      {track.album?.title || 'Single'}
                    </div>

                    <div className="w-32 hidden sm:block text-sm text-text-secondary">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </div>

                    <div className="flex items-center gap-4 text-text-secondary w-20 justify-end">
                      <LikeButton trackId={track.id} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      <TrackContextMenu onAdd={() => setAddModal({ trackId: track.id, title: track.title })} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
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
}

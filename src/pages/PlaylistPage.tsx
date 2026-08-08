import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playlistApi } from '@/api/playlist';
import { usePlayerStore } from '@/stores/playerStore';
import { useAuthStore } from '@/stores/authStore';

import AddToPlaylistModal from '@/components/AddToPlaylistModal';
import TrackContextMenu from '@/components/TrackContextMenu';
import LikeButton from '@/components/LikeButton';

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const playQueue = usePlayerStore((s) => s.playQueue);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const user = useAuthStore((s) => s.user);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addModal, setAddModal] = useState<{ trackId: string; title: string } | null>(null);

  const { data: playlist, isLoading } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => playlistApi.getPlaylist(id!),
    enabled: !!id,
  });

  const removeTrackMutation = useMutation({
    mutationFn: (trackId: string) => playlistApi.removeTrack(id!, trackId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlist', id] }),
  });

  const renameMutation = useMutation({
    mutationFn: (name: string) => playlistApi.updatePlaylist(id!, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist', id] });
      queryClient.invalidateQueries({ queryKey: ['myPlaylists'] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => playlistApi.deletePlaylist(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPlaylists'] });
      navigate('/library');
    },
  });

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

  if (!playlist) {
    return (
      <div className="flex h-full items-center justify-center p-8 animate-fade-in">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Playlist not found</h2>
          <p className="mt-2 text-text-secondary">We couldn't find the playlist you're looking for.</p>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === playlist.userId;

  const handlePlayAll = () => {
    if (!playlist.tracks || playlist.tracks.length === 0) return;

    const playerTracks = playlist.tracks.map((pt) => ({
      id: pt.track.id,
      title: pt.track.title,
      artist: pt.track.artist.name,
      artistId: pt.track.artist.id,
      album: pt.track.album?.title,
      artworkUrl: pt.track.album?.coverUrl ?? undefined,
      durationMs: pt.track.durationMs,
    }));

    playQueue(playerTracks, 0);
  };

  return (
    <div className="flex flex-col pb-32 animate-fade-in">
      {/* Hero Header */}
      <div className="relative flex min-h-[320px] md:h-80 flex-col justify-end bg-gradient-to-b from-primary/30 to-base p-4 md:p-8">
        <div className="absolute inset-0 z-0 opacity-20">
          {playlist.coverUrl ? (
            <img
              src={playlist.coverUrl}
              alt=""
              className="h-full w-full object-cover blur-sm"
            />
          ) : (
            <div className="h-full w-full bg-base-highlight" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-base to-transparent z-10" />

        <div className="relative z-20 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left pt-12 md:pt-0">
          <div className="h-48 w-48 overflow-hidden rounded-md shadow-2xl bg-base-highlight flex-shrink-0 border border-border">
            {playlist.coverUrl ? (
              <img src={playlist.coverUrl} alt={playlist.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl text-text-secondary">
                🎵
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 mb-2 flex-1 items-center md:items-start">
            <span className="text-sm font-bold uppercase tracking-widest text-text-secondary">
              {playlist.isPublic ? 'Public Playlist' : 'Private Playlist'}
            </span>
            {isEditing ? (
              <form
                className="flex items-center gap-3"
                onSubmit={(e) => { e.preventDefault(); renameMutation.mutate(editName); }}
              >
                <input
                  autoFocus
                  className="input-base text-3xl font-extrabold bg-base-highlight"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={200}
                />
                <button type="submit" className="btn-primary" disabled={renameMutation.isPending}>
                  {renameMutation.isPending ? 'Saving…' : 'Save'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>
              </form>
            ) : (
              <h1 className="text-6xl font-extrabold tracking-tighter text-white">{playlist.name}</h1>
            )}
            {playlist.description && <p className="text-text-secondary max-w-2xl line-clamp-2 mt-2">{playlist.description}</p>}
            <div className="text-sm font-medium text-text-secondary mt-2">
              Created by {isOwner ? 'You' : 'User'} • {playlist.tracks?.length || 0} songs
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
            disabled={!playlist.tracks || playlist.tracks.length === 0}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          {isOwner && !isEditing && (
            <>
              <button
                className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-text-secondary hover:text-white hover:border-white transition-colors"
                onClick={() => { setEditName(playlist.name); setIsEditing(true); }}
              >
                ✏️ Rename
              </button>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-400">Delete this playlist?</span>
                  <button
                    className="rounded-md bg-red-500 px-3 py-1 text-sm font-bold text-white hover:bg-red-400"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                  </button>
                  <button className="text-sm text-text-secondary hover:text-white" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                </div>
              ) : (
                <button
                  className="rounded-full border border-red-500/30 px-4 py-1.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  🗑️ Delete
                </button>
              )}
            </>
          )}
        </div>

        {/* Tracks List */}
        <section>
          {(!playlist.tracks || playlist.tracks.length === 0) ? (
            <div className="text-center py-12 border-t border-border mt-4">
              <h3 className="text-xl font-bold text-white mb-2">It's a bit empty here...</h3>
              <p className="text-text-secondary mb-4">Let's find some songs for your playlist</p>
              <Link to="/search" className="btn-primary inline-flex">Go to Search</Link>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Header row */}
              <div className="flex items-center gap-4 p-2 text-sm font-bold text-text-secondary border-b border-border mb-2 uppercase tracking-wider">
                <div className="w-6 text-center">#</div>
                <div className="flex-1">Title</div>
                <div className="w-48 hidden md:block">Album</div>
                <div className="w-32 hidden sm:block">Added</div>
                <div className="w-20"></div>
              </div>

              {playlist.tracks.map((pt, index) => (
                <div
                  key={pt.id}
                  className="group flex cursor-pointer items-center gap-4 rounded-md p-2 hover:bg-base-highlight transition-colors"
                  onClick={() => playTrack({
                    id: pt.track.id,
                    title: pt.track.title,
                    artist: pt.track.artist.name,
                    artistId: pt.track.artist.id,
                    album: pt.track.album?.title,
                    artworkUrl: pt.track.album?.coverUrl ?? undefined,
                    durationMs: pt.track.durationMs
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
                      {pt.track.album?.coverUrl ? (
                        <img src={pt.track.album?.coverUrl} alt={pt.track.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-text-secondary">♫</div>
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate font-medium text-white group-hover:text-brand transition-colors">
                        {pt.track.title}
                      </span>
                      {pt.track.artist && (
                        <Link
                          to={`/artist/${pt.track.artist.id}`}
                          className="truncate text-sm text-text-secondary hover:text-white hover:underline block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {pt.track.artist.name}
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="w-48 hidden md:block truncate text-sm text-text-secondary hover:text-white transition-colors">
                    {pt.track.album?.title || 'Single'}
                  </div>

                  <div className="w-32 hidden sm:block text-sm text-text-secondary">
                    {new Date(pt.addedAt).toLocaleDateString()}
                  </div>

                  <div className="flex items-center gap-4 text-text-secondary w-20 justify-end">
                    <LikeButton trackId={pt.track.id} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    <TrackContextMenu
                      onAdd={() => setAddModal({ trackId: pt.track.id, title: pt.track.title })}
                      onRemove={isOwner ? () => removeTrackMutation.mutate(pt.id) : undefined}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {addModal && (
        <AddToPlaylistModal trackId={addModal.trackId} trackTitle={addModal.title} onClose={() => setAddModal(null)} />
      )}
    </div>
  );
}
    </div >
  );
}

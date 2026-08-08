import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { playlistApi } from '@/api/playlist';
import { useAuthStore } from '@/stores/authStore';
import { useLikedSongs } from '@/hooks/useLikedSongs';

export default function LibraryPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const { totalLiked, isLoading: isLikesLoading } = useLikedSongs();

  const { data: playlists = [], isLoading: isPlaylistsLoading } = useQuery({
    queryKey: ['myPlaylists'],
    queryFn: playlistApi.getMyPlaylists,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => playlistApi.createPlaylist({ name, description: '' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myPlaylists'] });
      setIsCreating(false);
      setNewPlaylistName('');
      navigate(`/playlist/${data.id}`);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      createMutation.mutate(newPlaylistName.trim());
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-8 p-4 md:p-8 animate-fade-in pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Your Library</h1>
          <p className="mt-2 text-text-secondary">Your playlists, albums, and saved songs</p>
        </div>
        {!isCreating && (
          <button 
            className="btn-primary flex items-center gap-2"
            onClick={() => setIsCreating(true)}
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create playlist
          </button>
        )}
      </div>

      {/* Create Playlist Form */}
      {isCreating && (
        <form onSubmit={handleCreate} className="bg-base-elevated p-6 rounded-xl border border-border shadow-lg flex flex-col gap-4 max-w-md animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-white">Create new playlist</h2>
          <input
            type="text"
            placeholder="My awesome playlist"
            className="input-base w-full"
            autoFocus
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            disabled={createMutation.isPending}
          />
          <div className="flex gap-2 justify-end mt-2">
            <button 
              type="button" 
              className="btn-ghost"
              onClick={() => setIsCreating(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={!newPlaylistName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Chips (Visual only) */}
      <div className="flex gap-3">
        <button className="px-4 py-1.5 rounded-full bg-base-highlight text-white text-sm font-medium hover:bg-white hover:text-black transition-colors">Playlists</button>
        <button className="px-4 py-1.5 rounded-full bg-base-elevated text-text-secondary text-sm font-medium hover:bg-base-highlight transition-colors">Artists</button>
        <button className="px-4 py-1.5 rounded-full bg-base-elevated text-text-secondary text-sm font-medium hover:bg-base-highlight transition-colors">Albums</button>
      </div>

      {/* Playlists Grid */}
      {(isPlaylistsLoading || isLikesLoading) ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="card group flex flex-col gap-4">
              <div className="skeleton aspect-square w-full rounded-md" />
              <div className="skeleton h-5 w-3/4 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : playlists.length > 0 ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {/* Liked Songs Special Card */}
          <Link to="/collection/tracks" className="card relative flex flex-col justify-end gap-4 overflow-hidden p-4 transition-transform hover:scale-[1.02] hover:shadow-xl rounded-xl col-span-2 sm:col-span-2 bg-gradient-to-br from-indigo-700 to-purple-800 cursor-pointer">
            <div className="relative z-10 mt-16">
              <h3 className="text-3xl font-bold text-white mb-2">Liked Songs</h3>
              <p className="text-indigo-100 font-medium">{totalLiked} liked song{totalLiked !== 1 && 's'}</p>
            </div>
          </Link>

          {/* User Playlists */}
          {playlists.map((playlist) => (
            <Link
              to={`/playlist/${playlist.id}`}
              key={playlist.id}
              className="card group relative flex cursor-pointer flex-col gap-4 overflow-hidden bg-base-elevated p-4 transition-all hover:bg-base-highlight hover:shadow-xl rounded-xl"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-md shadow-md bg-base-highlight flex items-center justify-center">
                <span className="text-4xl absolute text-text-secondary">🎵</span>
                {playlist.coverUrl && (
                  <img
                    src={playlist.coverUrl}
                    alt={playlist.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 relative z-10 bg-base-elevated"
                    onError={(e) => {
                      e.currentTarget.style.opacity = '0';
                    }}
                  />
                )}
                
                {/* Hover Play Button */}
                <button className="absolute bottom-2 right-2 flex h-12 w-12 translate-y-4 items-center justify-center rounded-full bg-primary text-black opacity-0 shadow-lg transition-all hover:scale-105 hover:bg-primary-hover group-hover:translate-y-0 group-hover:opacity-100">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 ml-1">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
              <div>
                <h3 className="truncate font-bold text-white mb-1">{playlist.name}</h3>
                <span className="truncate text-sm text-text-secondary">
                  By {user?.displayName || 'You'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 text-6xl">🗂️</div>
          <h2 className="text-2xl font-bold text-white">Create your first playlist</h2>
          <p className="mt-2 text-text-secondary max-w-sm mb-6">
            It's easy, we'll help you.
          </p>
          <button className="btn-primary" onClick={() => setIsCreating(true)}>
            Create playlist
          </button>
        </div>
      )}
    </div>
  );
}

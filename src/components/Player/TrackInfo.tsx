/**
 * src/components/Player/TrackInfo.tsx
 *
 * Displays the current track's artwork, title, and artist.
 */

import { usePlayerStore } from '@/stores/playerStore';
import { Link } from 'react-router-dom';
import { useLikedSongs } from '@/hooks/useLikedSongs';

export default function TrackInfo() {
  const { currentTrack, error } = usePlayerStore();
  const { isLiked, toggleLike } = useLikedSongs();

  if (!currentTrack) {
    return (
      <div className="flex w-full items-center gap-3">
        {/* Placeholder skeleton */}
        <div className="h-14 w-14 rounded bg-base-highlight skeleton" />
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 rounded bg-base-highlight skeleton" />
          <div className="h-2 w-16 rounded bg-base-highlight skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {currentTrack.artworkUrl ? (
        <img 
          src={currentTrack.artworkUrl} 
          alt={currentTrack.album || currentTrack.title} 
          className="h-14 w-14 rounded-sm object-cover shadow-sm"
        />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-[#282828] shadow-sm">
          <svg className="h-6 w-6 text-[#b3b3b3]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
      )}

      <div className="flex flex-col justify-center overflow-hidden mr-4">
        <Link 
          to={`/track/${currentTrack.id}`} 
          className="truncate text-sm font-semibold text-white hover:underline"
        >
          {currentTrack.title}
        </Link>
        {currentTrack.artistId ? (
          <Link to={`/artist/${currentTrack.artistId}`} className="truncate text-xs text-[#b3b3b3] hover:text-white hover:underline cursor-pointer">
            {currentTrack.artist}
          </Link>
        ) : (
          <span className="truncate text-xs text-[#b3b3b3]">
            {currentTrack.artist}
          </span>
        )}
        {currentTrack.album && (
          <span className="truncate text-xs text-[#b3b3b3] ml-1">
            , {currentTrack.album}
          </span>
        )}
        {error && (
          <span className="text-xs text-red-500 truncate mt-1">
            Error: {error}
          </span>
        )}
      </div>

      <button 
        className={`flex items-center justify-center transition-colors hover:scale-110 ${
          isLiked(currentTrack.id) ? 'text-brand hover:text-brand-hover' : 'text-[#b3b3b3] hover:text-white'
        }`}
        onClick={() => toggleLike(currentTrack.id)}
        aria-label={isLiked(currentTrack.id) ? 'Remove from Your Library' : 'Save to Your Library'}
      >
        {isLiked(currentTrack.id) ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M11.999 4.887l-1.077-1.121C9.28 2.051 6.516 2.051 4.873 3.766c-1.642 1.716-1.642 4.499 0 6.214L12 17.5l7.126-7.519c1.642-1.716 1.642-4.499 0-6.214-1.642-1.715-4.407-1.715-6.049.001L12 4.887zm1.488-2.617c2.316-2.422 6.069-2.422 8.384 0 2.315 2.42 2.315 6.344 0 8.766L12 21 2.13 11.036c-2.316-2.42-2.316-6.345 0-8.766 2.315-2.42 6.068-2.42 8.384 0L12 3.9l1.487-1.63z" />
          </svg>
        )}
      </button>
    </div>
  );
}

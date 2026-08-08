import React from 'react';
import { useLikedSongs } from '@/hooks/useLikedSongs';

interface LikeButtonProps {
  trackId: string;
  className?: string;
}

export default function LikeButton({ trackId, className = '' }: LikeButtonProps) {
  const { isLiked, toggleLike } = useLikedSongs();
  const liked = isLiked(trackId);

  return (
    <button
      type="button"
      className={`flex items-center justify-center transition-colors hover:scale-110 ${liked ? 'text-brand hover:text-brand-hover' : 'text-[#b3b3b3] hover:text-white'
        } ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        toggleLike(trackId);
      }}
      aria-label={liked ? 'Remove from Your Library' : 'Save to Your Library'}
    >
      {liked ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M11.999 4.887l-1.077-1.121C9.28 2.051 6.516 2.051 4.873 3.766c-1.642 1.716-1.642 4.499 0 6.214L12 17.5l7.126-7.519c1.642-1.716 1.642-4.499 0-6.214-1.642-1.715-4.407-1.715-6.049.001L12 4.887zm1.488-2.617c2.316-2.422 6.069-2.422 8.384 0 2.315 2.42 2.315 6.344 0 8.766L12 21 2.13 11.036c-2.316-2.42-2.316-6.345 0-8.766 2.315-2.42 6.068-2.42 8.384 0L12 3.9l1.487-1.63z" />
        </svg>
      )}
    </button>
  );
}

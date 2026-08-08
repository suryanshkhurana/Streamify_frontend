import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { likesApi } from '@/api/likes';

export function useLikedSongs() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['likedSongs'],
    queryFn: () => likesApi.getLikedSongs(1, 1000), // Fetch up to 1000 for local lookup
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const likedTracks = data?.likes || [];
  const totalLiked = data?.total || 0;
  
  // Set for fast lookup
  const likedTrackIds = new Set(likedTracks.map((l) => l.trackId));

  const isLiked = (trackId: string) => likedTrackIds.has(trackId);

  const likeMutation = useMutation({
    mutationFn: likesApi.likeTrack,
    onMutate: async (trackId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['likedSongs'] });
      const previousData = queryClient.getQueryData(['likedSongs']);
      queryClient.setQueryData(['likedSongs'], (old: any) => {
        if (!old) return { likes: [{ trackId }], total: 1 };
        return {
          ...old,
          likes: [{ trackId }, ...old.likes],
          total: old.total + 1,
        };
      });
      return { previousData };
    },
    onError: (_err, _newVal, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['likedSongs'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['likedSongs'] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: likesApi.unlikeTrack,
    onMutate: async (trackId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['likedSongs'] });
      const previousData = queryClient.getQueryData(['likedSongs']);
      queryClient.setQueryData(['likedSongs'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          likes: old.likes.filter((l: any) => l.trackId !== trackId),
          total: Math.max(0, old.total - 1),
        };
      });
      return { previousData };
    },
    onError: (_err, _newVal, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['likedSongs'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['likedSongs'] });
    },
  });

  const toggleLike = (trackId: string) => {
    if (isLiked(trackId)) {
      unlikeMutation.mutate(trackId);
    } else {
      likeMutation.mutate(trackId);
    }
  };

  return {
    likedTracks,
    totalLiked,
    isLoading,
    isLiked,
    toggleLike,
    isLiking: likeMutation.isPending || unlikeMutation.isPending,
  };
}

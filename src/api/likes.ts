import { api } from '@/lib/axios';
import { catalogApi, type CatalogTrack } from './catalog';

export interface LikedSong {
  id: string;
  userId: string;
  trackId: string;
  createdAt: string;
  track?: CatalogTrack;
}

export const likesApi = {
  getLikedSongs: async (page = 1, limit = 50): Promise<{ likes: LikedSong[]; total: number }> => {
    try {
      const { data } = await api.get(`/likes?page=${page}&limit=${limit}`);
      const likes = data.data as LikedSong[];
      const total = data.meta?.total || 0;

      // Populate tracks from catalog
      const trackIds = likes.map((l) => l.trackId);
      if (trackIds.length > 0) {
        const catalogTracks = await catalogApi.getTracksByIds(trackIds);
        const trackMap = new Map(catalogTracks.map((t) => [t.id, t]));
        likes.forEach((l) => {
          l.track = trackMap.get(l.trackId);
        });
      }

      return { likes: likes.filter((l) => l.track), total };
    } catch (e) {
      return { likes: [], total: 0 };
    }
  },

  likeTrack: async (trackId: string): Promise<void> => {
    await api.post(`/likes/${trackId}`);
  },

  unlikeTrack: async (trackId: string): Promise<void> => {
    await api.delete(`/likes/${trackId}`);
  },
};

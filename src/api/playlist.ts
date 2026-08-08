import { api } from '@/lib/axios';
import type { CatalogTrack } from './catalog';

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistTrack {
  id: string; // The join table ID
  playlistId: string;
  trackId: string;
  addedAt: string;
  track: CatalogTrack;
}

export interface PlaylistWithTracks extends Playlist {
  tracks: PlaylistTrack[];
}

export const playlistApi = {
  // Get all playlists for the logged-in user
  getMyPlaylists: async (): Promise<Playlist[]> => {
    try {
      const { data } = await api.get('/playlists');
      return data.data;
    } catch (e) {
      return [];
    }
  },

  // Get a single playlist with its tracks
  getPlaylist: async (id: string): Promise<PlaylistWithTracks | null> => {
    try {
      const { data } = await api.get(`/playlists/${id}`);
      const playlist = data.data;

      // Populate track metadata from catalog-service
      const trackIds = (playlist.tracks || []).map((pt: any) => pt.trackId);
      if (trackIds.length > 0) {
        // dynamic import to avoid circular dependency if any
        const { catalogApi } = await import('./catalog');
        const catalogTracks = await catalogApi.getTracksByIds(trackIds);
        const trackMap = new Map(catalogTracks.map(t => [t.id, t]));

        playlist.tracks = playlist.tracks
          .map((pt: any) => ({
            ...pt,
            track: trackMap.get(pt.trackId) || null,
          }))
          .filter((pt: any) => pt.track !== null);
      }

      return playlist;
    } catch (e) {
      return null;
    }
  },

  // Create a new playlist
  createPlaylist: async (input: { name: string; description?: string }): Promise<Playlist> => {
    const { data } = await api.post('/playlists', input);
    return data.data;
  },

  // Update playlist details
  updatePlaylist: async (id: string, input: { name?: string; description?: string }): Promise<Playlist> => {
    const { data } = await api.patch(`/playlists/${id}`, input);
    return data.data;
  },

  // Delete a playlist
  deletePlaylist: async (id: string): Promise<void> => {
    await api.delete(`/playlists/${id}`);
  },

  // Add a track to a playlist
  addTrack: async (playlistId: string, trackId: string): Promise<void> => {
    await api.post(`/playlists/${playlistId}/tracks`, { trackIds: trackId });
  },

  // Remove a track from a playlist (requires the join table ID or track ID depending on backend)
  removeTrack: async (playlistId: string, trackId: string): Promise<void> => {
    await api.delete(`/playlists/${playlistId}/tracks/${trackId}`);
  },
};

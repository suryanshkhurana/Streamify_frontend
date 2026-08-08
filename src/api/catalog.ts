import { api } from '@/lib/axios';

export interface Album {
  id: string;
  title: string;
  coverUrl: string | null;
  artist?: {
    id: string;
    name: string;
  };
}

export interface CatalogTrack {
  id: string;
  title: string;
  artist: {
    id: string;
    name: string;
  };
  album?: {
    id: string;
    title: string;
    coverUrl: string | null;
  };
  playCount?: number;
  durationMs?: number;
  coverUrl?: string | null;
}

export interface Artist {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
}

export interface Playlist {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  ownerId: string;
}

export const catalogApi = {
  getTopTracks: async (): Promise<CatalogTrack[]> => {
    try {
      const { data } = await api.get('/catalog/tracks?sort=popular&limit=5');
      return data.tracks || data.data?.tracks || [];
    } catch (e) {
      return [];
    }
  },
  
  getNewReleases: async (): Promise<Album[]> => {
    try {
      const { data } = await api.get('/catalog/albums?sort=new');
      return data.data?.albums || data.albums || [];
    } catch (e) {
      return [];
    }
  },

  getTopCharts: async (): Promise<CatalogTrack[]> => {
    try {
      const { data } = await api.get('/catalog/tracks?sort=top');
      return data.tracks || data.data?.tracks || [];
    } catch (e) {
      return [];
    }
  },

  getArtists: async (): Promise<Artist[]> => {
    try {
      const { data } = await api.get('/catalog/artists?limit=50');
      return data.data || data.artists || [];
    } catch (e) {
      return [];
    }
  },

  getArtist: async (id: string): Promise<Artist> => {
    const { data } = await api.get(`/catalog/artists/${id}`);
    return data.data;
  },

  getArtistTopTracks: async (id: string): Promise<CatalogTrack[]> => {
    try {
      const { data } = await api.get(`/catalog/tracks?artistId=${id}&limit=10`);
      return data.data?.tracks || data.tracks || data.data || [];
    } catch (e) {
      return [];
    }
  },

  getArtistAlbums: async (id: string): Promise<Album[]> => {
    try {
      const { data } = await api.get(`/catalog/albums?artistId=${id}`);
      return data.data?.albums || data.albums || [];
    } catch (e) {
      return [];
    }
  },

  getAlbum: async (id: string): Promise<Album & { tracks: CatalogTrack[] }> => {
    const { data } = await api.get(`/catalog/albums/${id}`);
    const album = data.data;
    return {
      ...album,
      tracks: album.tracks || [],
    };
  },

  getTracksByIds: async (ids: string[]): Promise<CatalogTrack[]> => {
    if (!ids.length) return [];
    try {
      const { data } = await api.get(`/catalog/tracks?ids=${ids.join(',')}&limit=100`);
      return data.tracks || data.data?.tracks || [];
    } catch (e) {
      return [];
    }
  },

  updateMyArtist: async (data: Partial<Artist>): Promise<Artist> => {
    const { data: res } = await api.put('/catalog/artists/me', data);
    return res.data;
  },
};

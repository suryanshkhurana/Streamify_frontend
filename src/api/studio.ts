/**
 * src/api/studio.ts
 *
 * API client for Creator Studio.
 * Wraps catalog-service endpoints: artists, albums, tracks, and S3 direct upload.
 */

import { api } from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudioArtist {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  genres: string[];
  country: string | null;
}

export interface StudioAlbum {
  id: string;
  title: string;
  type: 'ALBUM' | 'EP' | 'SINGLE';
  coverUrl: string | null;
  releaseDate: string | null;
  genres: string[];
  isExplicit: boolean;
  trackCount?: number;
}

export interface StudioTrack {
  id: string;
  title: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
  durationMs: number | null;
  albumId: string | null;
  album?: { id: string; title: string; coverUrl: string | null } | null;
  playCount: number;
  isExplicit: boolean;
  genres: string[];
  createdAt: string;
}

// ─── Artist ───────────────────────────────────────────────────────────────────

export const studioApi = {

  /** GET /catalog/artists/me/profile — fetch my artist profile */
  getMyArtist: async (): Promise<StudioArtist | null> => {
    try {
      const { data } = await api.get('/catalog/artists/me/profile');
      return data.data as StudioArtist;
    } catch {
      return null;
    }
  },

  /** POST /catalog/artists — register as an artist (self-service) */
  createArtist: async (input: { name: string; bio?: string; genres?: string[] }): Promise<StudioArtist> => {
    const { data } = await api.post('/catalog/artists', input);
    return data.data as StudioArtist;
  },

  /** PUT /catalog/artists/me — update my artist profile */
  updateArtist: async (input: { name?: string; bio?: string; genres?: string[] }): Promise<StudioArtist> => {
    const { data } = await api.put('/catalog/artists/me', input);
    return data.data as StudioArtist;
  },

  // ─── Albums ─────────────────────────────────────────────────────────────────

  /** GET /catalog/albums?artistId=me — list my albums */
  getMyAlbums: async (artistId: string): Promise<StudioAlbum[]> => {
    try {
      const { data } = await api.get(`/catalog/albums?artistId=${artistId}&limit=100`);
      return (data.albums || data.data?.albums || []) as StudioAlbum[];
    } catch {
      return [];
    }
  },

  /** POST /catalog/albums — create a new album */
  createAlbum: async (input: {
    title: string;
    type?: 'ALBUM' | 'EP' | 'SINGLE';
    coverUrl?: string;
    genres?: string[];
    isExplicit?: boolean;
  }): Promise<StudioAlbum> => {
    const { data } = await api.post('/catalog/albums', input);
    return data.data as StudioAlbum;
  },

  /** DELETE /catalog/albums/:albumId — delete an album */
  deleteAlbum: async (albumId: string): Promise<void> => {
    await api.delete(`/catalog/albums/${albumId}`);
  },

  // ─── Tracks ─────────────────────────────────────────────────────────────────

  /** GET /catalog/tracks?artistId=... — list my tracks */
  getMyTracks: async (artistId: string): Promise<StudioTrack[]> => {
    try {
      const { data } = await api.get(`/catalog/tracks?artistId=${artistId}&limit=100`);
      return (data.tracks || data.data?.tracks || []) as StudioTrack[];
    } catch {
      return [];
    }
  },

  /**
   * POST /catalog/tracks — create a PENDING track record.
   * Returns the track AND a presigned S3 PUT URL.
   */
  createTrack: async (input: {
    title: string;
    albumId?: string;
    genres?: string[];
    isExplicit?: boolean;
    mimeType?: 'audio/mpeg' | 'audio/flac' | 'audio/wav' | 'audio/ogg';
    fileSizeBytes?: number;
  }): Promise<{ track: StudioTrack; uploadUrl: string }> => {
    const { data } = await api.post('/catalog/tracks', {
      mimeType: 'audio/mpeg',
      ...input,
    });
    return data.data as { track: StudioTrack; uploadUrl: string };
  },

  /**
   * Upload a File directly to S3 using a presigned PUT URL.
   * The request goes browser → S3, bypassing your backend entirely.
   * @param uploadUrl  The presigned S3 URL returned by createTrack
   * @param file       The audio File the user selected
   * @param onProgress Called with 0–100 as the upload progresses
   */
  uploadFileToS3: (
    uploadUrl: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'audio/mpeg');

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('S3 upload network error'));
      xhr.send(file);
    });
  },

  /** POST /catalog/tracks/:trackId/upload-complete — signal upload finished */
  markUploadComplete: async (trackId: string): Promise<void> => {
    await api.post(`/catalog/tracks/${trackId}/upload-complete`);
  },

  /** DELETE /catalog/tracks/:trackId */
  deleteTrack: async (trackId: string): Promise<void> => {
    await api.delete(`/catalog/tracks/${trackId}`);
  },
};

/**
 * src/api/user.ts
 * API client for user-service: profile, follow/unfollow, listening history.
 */

import { api } from '@/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  authId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  country: string | null;
  role: string;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

export interface HistoryEntry {
  id: string;
  trackId: string;
  playedAt: string;
  track?: {
    id: string;
    title: string;
    artist: { id: string; name: string };
    album?: { id: string; title: string; coverUrl: string | null } | null;
    durationMs?: number;
  };
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const userApi = {
  /** GET /users/me — own profile */
  getMe: async (): Promise<UserProfile> => {
    const { data } = await api.get('/users/me');
    return data.data as UserProfile;
  },

  /** PUT /users/me — update own display name / bio / avatar */
  updateMe: async (input: { displayName?: string; bio?: string; country?: string; avatarUrl?: string }): Promise<UserProfile> => {
    const { data } = await api.put('/users/me', input);
    return data.data as UserProfile;
  },

  /** GET /users/:id — public profile of another user */
  getProfile: async (id: string): Promise<UserProfile> => {
    const { data } = await api.get(`/users/${id}`);
    return data.data as UserProfile;
  },

  /** POST /users/:id/follow */
  follow: async (id: string): Promise<void> => {
    await api.post(`/users/${id}/follow`, { targetType: 'USER' });
  },

  /** DELETE /users/:id/follow */
  unfollow: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}/follow?targetType=USER`);
  },

  /** GET /users/me/history — listening history (paginated) */
  getHistory: async (limit = 20): Promise<HistoryEntry[]> => {
    try {
      const { data } = await api.get(`/users/me/history?limit=${limit}`);
      // Backend wraps in { success, data: { history: [...] } } or { success, data: [...] }
      const raw = data.data;
      if (Array.isArray(raw)) return raw as HistoryEntry[];
      if (raw?.history) return raw.history as HistoryEntry[];
      return [];
    } catch {
      return [];
    }
  },

  /**
   * POST /users/:userId/profile-picture/upload-url
   * Gets a presigned S3 PUT URL for uploading a profile picture.
   */
  getProfilePictureUploadUrl: async (
    userId: string,
    mimeType: string,
    fileSizeBytes: number,
  ): Promise<{ uploadUrl: string; s3Key: string; expiresIn: number }> => {
    const { data } = await api.post(`/users/${userId}/profile-picture/upload-url`, {
      mimeType,
      fileSizeBytes,
    });
    return data.data as { uploadUrl: string; s3Key: string; expiresIn: number };
  },

  /**
   * POST /users/:userId/profile-picture/confirm
   * Confirms the upload and updates the user's avatarUrl to the CloudFront URL.
   */
  confirmProfilePictureUpload: async (
    userId: string,
    s3Key: string,
  ): Promise<{ avatarUrl: string }> => {
    const { data } = await api.post(`/users/${userId}/profile-picture/confirm`, { s3Key });
    return data.data as { avatarUrl: string };
  },
};

/**
 * src/hooks/useRestoreSession.ts
 *
 * Silent session restore — called once on app mount.
 *
 * Strategy:
 *  1. If Zustand already has an accessToken (e.g. same-tab navigation),
 *     call GET /auth/me to validate it and re-hydrate the user profile.
 *  2. If there is no token in memory, still call GET /auth/me.
 *     The request carries the httpOnly refresh-token cookie; the api-gateway
 *     will validate it and return fresh user claims if the cookie is valid.
 *  3. On success → setAuth(token, user).
 *  4. On failure (401 / no cookie) → clearAuth() — the user will need to log in.
 *
 * The `isLoading` flag is set to `true` in the initial store state and
 * is flipped to `false` by either setAuth or clearAuth.
 */

import { useEffect, useRef } from 'react';

import api from '@/lib/axios';
import { type AuthUser, useAuthStore } from '@/stores/authStore';

import { userApi } from '@/api/user';

interface MeResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: AuthUser;
  };
}



export function useRestoreSession(): void {
  const { setAuth, clearAuth, setLoading, setAccessToken } = useAuthStore();
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;

    let cancelled = false;

    async function restore() {
      setLoading(true);
      try {
        const refreshRes = await api.post<MeResponse>('/auth/refresh');
        if (cancelled) return;

        const { accessToken, user: basicUser } = refreshRes.data.data;

        setAccessToken(accessToken);

        try {
          const profile = await userApi.getMe();
          if (!cancelled) {
            setAuth(accessToken, {
              ...basicUser,
              displayName: profile.displayName,
              avatarUrl: profile.avatarUrl,
              bio: profile.bio,
            });
          }
        } catch (profileErr) {
          console.warn('Failed to fetch full profile', profileErr);
          if (!cancelled) {
            setAuth(accessToken, basicUser);
          }
        }
      } catch {
        if (!cancelled) {
          clearAuth();
        }
      }
    }

    void restore();

    return () => {
      cancelled = true;
      effectRan.current = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

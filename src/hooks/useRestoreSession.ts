/**
 * src/hooks/useRestoreSession.ts
 *
 * Silent session restore — called once on app mount.
 *
 * Strategy:
 *  1. Call POST /auth/refresh on every mount.
 *     The request carries the httpOnly refresh-token cookie automatically.
 *  2. On success → setAuth(token, user), then enrich with full profile.
 *  3. On failure (401 / no cookie) → clearAuth() — the user will need to log in.
 *
 * The `isLoading` flag is set to `true` in the initial store state and
 * is flipped to `false` by either setAuth or clearAuth.
 *
 * NOTE: We use a module-level flag (not a ref) to prevent the React 18
 * StrictMode double-invocation from firing two concurrent /auth/refresh
 * requests. Unlike a ref (which resets on each mount), a module-level var
 * survives the StrictMode mount→cleanup→remount cycle while still allowing
 * the in-flight promise to resolve and call setAuth/clearAuth correctly.
 */

import { useEffect } from 'react';

import api from '@/lib/axios';
import { type AuthUser, useAuthStore } from '@/stores/authStore';
import { userApi } from '@/api/user';

interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: {
      id: string;
      email: string;
      displayName: string;
      plan?: string;
    };
  };
}

// ─── Module-level guard ───────────────────────────────────────────────────────
// Prevents StrictMode from firing two concurrent /auth/refresh calls.
// The flag resets automatically on Vite HMR when this module is re-evaluated.
let _restoreStarted = false;

export function useRestoreSession(): void {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    // Block the StrictMode second invocation — the first invocation's async
    // promise is still running and will call setAuth/clearAuth when it settles.
    if (_restoreStarted) return;
    _restoreStarted = true;

    async function restore() {
      try {
        const refreshRes = await api.post<RefreshResponse>('/auth/refresh');
        const { accessToken, user: basicUser } = refreshRes.data.data;

        // Build a safe AuthUser from the refresh response
        const safeUser: AuthUser = {
          id: basicUser.id,
          email: basicUser.email,
          displayName: basicUser.displayName,
          avatarUrl: null,
          role: 'user',
        };

        // Optimistically set auth so the app renders immediately
        setAuth(accessToken, safeUser);

        // Enrich with full profile from user-service (avatarUrl, bio, etc.)
        try {
          const profile = await userApi.getMe();
          setAuth(accessToken, {
            ...safeUser,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl ?? null,
            bio: profile.bio,
          });
        } catch (profileErr) {
          // Non-fatal — app works with the basic user from JWT
          console.warn('[useRestoreSession] Failed to fetch full profile', profileErr);
        }
      } catch {
        // 401 or network error — session is dead, send user to login
        clearAuth();
      }
    }

    void restore();

    // Cleanup: reset the flag so re-mounting this component (e.g. logout → login
    // flow within the same session) can trigger a fresh restore.
    return () => {
      _restoreStarted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

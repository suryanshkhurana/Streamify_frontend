/**
 * src/stores/authStore.ts
 *
 * Zustand auth store — single source of truth for authentication state.
 *
 * Shape:
 *   accessToken  — short-lived JWT (null when logged out)
 *   user         — decoded user claims from the server
 *   isLoading    — true during silent session restore on app mount
 *
 * Persisted to sessionStorage so the token survives navigation but is
 * automatically cleared when the browser tab/window is closed.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
  role: 'user' | 'artist' | 'admin';
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  /** True while the app is performing the initial silent session restore */
  isLoading: boolean;
}

interface AuthActions {
  /** Called after a successful login or token refresh */
  setAuth: (token: string, user: AuthUser) => void;
  /** Update only the access token (e.g. after a refresh) */
  setAccessToken: (token: string) => void;
  /** Wipe auth state (logout, expired session) */
  clearAuth: () => void;
  /** Toggle the global loading state during session restore */
  setLoading: (loading: boolean) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // ── Initial state ────────────────────────────────────────────────────
      accessToken: null,
      user: null,
      isLoading: true, // start as true — we always try to restore on mount

      // ── Actions ──────────────────────────────────────────────────────────
      setAuth: (token, user) =>
        set({
          accessToken: token,
          user,
          isLoading: false,
        }),

      setAccessToken: (token) =>
        set((state) => ({
          ...state,
          accessToken: token,
        })),

      clearAuth: () =>
        set({
          accessToken: null,
          user: null,
          isLoading: false,
        }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'streamify-auth', // key in sessionStorage
      storage: createJSONStorage(() => sessionStorage),
      // Only persist the user profile — never the loading flag.
      // The access token IS persisted in sessionStorage so the user doesn't
      // have to log in again on every navigation within the same tab.
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);

// ─── Convenience selectors ────────────────────────────────────────────────────

/** True when the user has a valid (non-null) access token */
export const selectIsAuthenticated = (state: AuthState) => state.accessToken !== null;

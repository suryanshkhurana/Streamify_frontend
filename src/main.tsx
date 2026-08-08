/**
 * src/main.tsx
 *
 * React 18 application entry point.
 *
 * Provider stack (outermost → innermost):
 *  <React.StrictMode>
 *    <GoogleOAuthProvider>     — Google OAuth client-side SDK
 *      <QueryClientProvider>  — TanStack Query v5
 *        <BrowserRouter>      — React Router v6
 *          <SessionRestoreGate> — silent session restore on mount
 *            <App />
 *          </SessionRestoreGate>
 *        </BrowserRouter>
 *      </QueryClientProvider>
 *    </GoogleOAuthProvider>
 *  </React.StrictMode>
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';

import App from './App';
import LoadingScreen from './components/LoadingScreen';
import { useRestoreSession } from './hooks/useRestoreSession';
import { useAuthStore } from './stores/authStore';
import './index.css';

import { queryClient } from './lib/react-query';

// ─── Google OAuth Client ID (set VITE_GOOGLE_CLIENT_ID in .env) ───────────────
const GOOGLE_CLIENT_ID =
  (import.meta.env['VITE_GOOGLE_CLIENT_ID'] as string | undefined) ?? '';

// ─── Session restore gate ─────────────────────────────────────────────────────
// Calls POST /auth/refresh on mount (sends httpOnly cookie automatically).
// Shows the loading screen until auth state is resolved.

function SessionRestoreGate({ children }: { children: React.ReactNode }) {
  useRestoreSession();
  const isLoading = useAuthStore((s) => s.isLoading);
  if (isLoading) return <LoadingScreen />;
  return <>{children}</>;
}

// ─── Mount ────────────────────────────────────────────────────────────────────

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SessionRestoreGate>
            <App />
          </SessionRestoreGate>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);

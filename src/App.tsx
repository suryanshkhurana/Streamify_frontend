/**
 * src/App.tsx
 *
 * Root routing component for the Streamify SPA.
 *
 * Route structure:
 *
 *  PUBLIC (no auth required)
 *   /login          — LoginPage
 *   /register       — RegisterPage
 *
 *  PROTECTED (requires valid access token)
 *   /               — HomePage
 *   /search         — SearchPage
 *   /library        — LibraryPage
 *   /discover       — DiscoverPage
 *   /settings       — SettingsPage
 *   /track/:id      — TrackDetailPage   (placeholder)
 *   /album/:id      — AlbumDetailPage   (placeholder)
 *   /artist/:id     — ArtistDetailPage  (placeholder)
 *   /playlist/:id   — PlaylistDetailPage (placeholder)
 *
 *  FALLBACK
 *   *               — NotFoundPage
 *
 * The <ProtectedRoute> wrapper:
 *  - Shows <LoadingScreen> while the silent session restore is in progress
 *  - Redirects to /login (with `redirect` param) if no access token
 *  - Renders <AppShell> (sidebar + player) around <Outlet> when authenticated
 */

import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/layouts/AppShell';
import DiscoverPage from '@/pages/DiscoverPage';
import HomePage from '@/pages/HomePage';
import LibraryPage from '@/pages/LibraryPage';
import LoginPage from '@/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import RegisterPage from '@/pages/RegisterPage';
import SearchPage from '@/pages/SearchPage';
import SettingsPage from '@/pages/SettingsPage';
import LikedSongsPage from '@/pages/LikedSongsPage';

import ArtistPage from '@/pages/ArtistPage';
import PlaylistPage from '@/pages/PlaylistPage';
import AlbumPage from '@/pages/AlbumPage';
import StudioDashboardPage from '@/pages/studio/StudioDashboardPage';
import StudioUploadPage from '@/pages/studio/StudioUploadPage';
import StudioAlbumsPage from '@/pages/studio/StudioAlbumsPage';

// ─── Inline placeholder for detail pages (implemented in later steps) ─────────
const DetailPlaceholder = ({ type }: { type: string }) => (
  <div className="flex flex-col gap-4 p-8 animate-fade-in">
    <h1 className="text-2xl font-bold capitalize text-white">{type} Detail</h1>
    <p className="text-text-secondary">This page will be built in a later step.</p>
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      {/* ── Public routes ──────────────────────────────────────────────── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── Protected routes (wrapped in AppShell) ─────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/collection/tracks" element={<LikedSongsPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Detail pages — to be implemented in later steps */}
          <Route path="/track/:id" element={<DetailPlaceholder type="track" />} />
          <Route path="/album/:id" element={<AlbumPage />} />
          <Route path="/artist/:id" element={<ArtistPage />} />
          <Route path="/playlist/:id" element={<PlaylistPage />} />

          {/* ── Creator Studio routes ────────────────────────────────────── */}
          <Route path="/studio" element={<StudioDashboardPage />} />
          <Route path="/studio/upload" element={<StudioUploadPage />} />
          <Route path="/studio/albums" element={<StudioAlbumsPage />} />
        </Route>
      </Route>

      {/* ── Root redirect (shouldn't be needed but acts as safety net) ─── */}
      <Route path="/index.html" element={<Navigate to="/" replace />} />

      {/* ── 404 fallback ────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

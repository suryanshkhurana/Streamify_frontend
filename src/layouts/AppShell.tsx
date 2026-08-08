/**
 * src/layouts/AppShell.tsx
 *
 * The main application shell rendered for all authenticated routes.
 *
 * Layout (3-zone):
 *  ┌──────────────────────────────────────────────────────┐
 *  │ Sidebar (240px fixed)  │ Main content area           │
 *  │                        │ (scrollable)                │
 *  │  - Logo                │                             │
 *  │  - Nav links           │  <Outlet /> renders here    │
 *  │  - User avatar/logout  │                             │
 *  └──────────────────────────────────────────────────────┘
 *  │             Player bar (90px fixed bottom)           │
 *  └──────────────────────────────────────────────────────┘
 */

import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import api from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import Player from '@/components/Player';

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/search', label: 'Search', icon: SearchIcon },
  { to: '/library', label: 'Your Library', icon: LibraryIcon },
  { to: '/discover', label: 'Discover', icon: DiscoverIcon },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

import { useQueryClient } from '@tanstack/react-query';

export default function AppShell() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors — clear locally regardless
    } finally {
      clearAuth();
      queryClient.clear();
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      {/* ── Left sidebar ──────────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-shrink-0 flex-col bg-black z-20"
        style={{ width: 'var(--sidebar-width)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5">
          <MusicNoteIcon className="h-8 w-8 text-brand" />
          <span className="text-lg font-extrabold tracking-tight text-white">
            Streamify
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 px-3 pb-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors duration-150',
                  isActive
                    ? 'bg-base-elevated text-white'
                    : 'text-text-secondary hover:text-white',
                ].join(' ')
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}

          {/* Divider */}
          <div className="my-2 border-t border-border" />

          {/* Creator Studio — only visible to artists */}
          {user?.role === 'artist' && (
            <NavLink
              to="/studio"
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors duration-150',
                  isActive
                    ? 'bg-brand/10 text-brand'
                    : 'text-brand/70 hover:text-brand',
                ].join(' ')
              }
            >
              <MicIcon className="h-5 w-5 flex-shrink-0" />
              Creator Studio
            </NavLink>
          )}

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors duration-150',
                isActive
                  ? 'bg-base-elevated text-white'
                  : 'text-text-secondary hover:text-white',
              ].join(' ')
            }
          >
            <SettingsIcon className="h-5 w-5 flex-shrink-0" />
            Settings
          </NavLink>
        </nav>

        {/* User footer */}
        <div className="border-t border-border px-3 py-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand font-bold text-sm text-black uppercase overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                user?.displayName?.[0] ?? '?'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user?.displayName ?? 'User'}
              </p>
              <p className="truncate text-xs text-text-muted">{user?.email ?? ''}</p>
            </div>
            {/* Logout */}
            <button
              onClick={() => void handleLogout()}
              className="flex-shrink-0 rounded-md p-1.5 text-text-secondary transition-colors hover:bg-base-highlight hover:text-white"
              aria-label="Log out"
              title="Log out"
            >
              <LogoutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Scrollable content */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: '32px' }}
        >
          <Outlet />
        </main>

        {/* ── Player bar ───────────────────────────────────────────── */}
        <footer
          className="flex-shrink-0 border-t border-border bg-base-elevated shadow-player z-20"
          style={{ height: 'var(--player-height)' }}
        >
          <Player />
        </footer>

        {/* ── Mobile Bottom Nav ────────────────────────────────────── */}
        <nav 
          className="md:hidden flex flex-shrink-0 w-full items-center justify-around bg-black border-t border-border z-20 pb-safe" 
          style={{ height: 'var(--mobile-nav-height)' }}
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-1 w-16 h-full text-[10px] font-medium transition-colors duration-150',
                  isActive ? 'text-white' : 'text-text-secondary hover:text-white',
                ].join(' ')
              }
            >
              <Icon className="h-6 w-6" />
              <span className="truncate w-full text-center">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  );
}

function LibraryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5a2.5 2.5 0 0 1-5 0A2.5 2.5 0 0 1 12.5 10c.57 0 1.08.19 1.5.51V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" />
    </svg>
  );
}

function DiscoverIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );
}

function MusicNoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  );
}

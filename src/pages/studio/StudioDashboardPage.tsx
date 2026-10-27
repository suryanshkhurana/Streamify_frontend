/**
 * src/pages/studio/StudioDashboardPage.tsx
 *
 * Creator Studio landing page. Shows artist stats and quick-action buttons.
 * Accessible at /studio for users with role === 'artist'.
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { studioApi, type StudioTrack } from '@/api/studio';

export default function StudioDashboardPage() {
const user = useAuthStore((s) => s.user);
  

  const { data: artist, isLoading: loadingArtist } = useQuery({
    queryKey: ['myArtist'],
    queryFn: studioApi.getMyArtist,
  });

  const { data: tracks = [], isLoading: loadingTracks } = useQuery({
    queryKey: ['myTracks', artist?.id],
    queryFn: () => studioApi.getMyTracks(artist!.id),
    enabled: !!artist?.id,
  });

  const { data: albums = [], isLoading: loadingAlbums } = useQuery({
    queryKey: ['myAlbums', artist?.id],
    queryFn: () => studioApi.getMyAlbums(artist!.id),
    enabled: !!artist?.id,
  });

  const readyTracks = tracks.filter((t) => t.status === 'READY');
  const processingTracks = tracks.filter((t) => t.status === 'PROCESSING' || t.status === 'PENDING');
  const totalPlays = tracks.reduce((acc, t) => acc + (t.playCount || 0), 0);

  return (
    <div className="flex flex-col gap-10 p-8 animate-fade-in pb-32">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand mb-1">Creator Studio</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            {loadingArtist ? (
              <span className="skeleton inline-block h-10 w-64 rounded" />
            ) : (
              `Welcome back, ${artist?.name ?? user?.displayName ?? 'Artist'}`
            )}
          </h1>
          <p className="mt-2 text-text-secondary">Manage your music, albums, and profile.</p>
        </div>
        <Link
          to="/studio/upload"
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
          </svg>
          Upload Track
        </Link>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Total Tracks',
            value: loadingTracks ? '—' : tracks.length,
            icon: '🎵',
            color: 'from-violet-600/20 to-violet-600/5',
          },
          {
            label: 'Live Now',
            value: loadingTracks ? '—' : readyTracks.length,
            icon: '✅',
            color: 'from-green-600/20 to-green-600/5',
          },
          {
            label: 'Processing',
            value: loadingTracks ? '—' : processingTracks.length,
            icon: '⏳',
            color: 'from-yellow-600/20 to-yellow-600/5',
          },
          {
            label: 'Total Plays',
            value: loadingTracks ? '—' : totalPlays.toLocaleString(),
            icon: '▶️',
            color: 'from-brand/20 to-brand/5',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl bg-gradient-to-br ${stat.color} border border-border p-5 flex flex-col gap-2`}
          >
            <span className="text-2xl">{stat.icon}</span>
            <p className="text-3xl font-extrabold text-white">{stat.value}</p>
            <p className="text-sm text-text-secondary">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          to="/studio/upload"
          className="flex flex-col gap-3 rounded-2xl bg-base-elevated border border-border p-6 hover:bg-base-highlight hover:border-brand/50 transition-all group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand group-hover:bg-brand/20 transition-colors">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white">Upload a Track</h3>
            <p className="text-sm text-text-secondary mt-1">Upload your audio file and we'll handle transcoding.</p>
          </div>
        </Link>

        <Link
          to="/studio/albums"
          className="flex flex-col gap-3 rounded-2xl bg-base-elevated border border-border p-6 hover:bg-base-highlight hover:border-brand/50 transition-all group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20 transition-colors">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5a2.5 2.5 0 0 1-5 0A2.5 2.5 0 0 1 12.5 10c.57 0 1.08.19 1.5.51V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white">Manage Albums</h3>
            <p className="text-sm text-text-secondary mt-1">Create albums and organise your discography.</p>
          </div>
        </Link>

        <Link
          to={artist?.id ? `/artist/${artist.id}` : '#'}
          className="flex flex-col gap-3 rounded-2xl bg-base-elevated border border-border p-6 hover:bg-base-highlight hover:border-brand/50 transition-all group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white">View Public Profile</h3>
            <p className="text-sm text-text-secondary mt-1">See how your artist page looks to listeners.</p>
          </div>
        </Link>
      </div>

      {/* ── Recent Tracks Table ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Your Tracks</h2>
          <Link to="/studio/upload" className="text-sm font-semibold text-brand hover:text-brand-hover transition-colors">
            + Upload new
          </Link>
        </div>

        {loadingTracks ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
                <div className="skeleton h-10 w-10 rounded flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="skeleton h-4 w-48 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
                <div className="skeleton h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl">
            <span className="text-5xl mb-4">🎵</span>
            <h3 className="text-xl font-bold text-white mb-2">No tracks yet</h3>
            <p className="text-text-secondary mb-6">Upload your first track to get started.</p>
            <Link to="/studio/upload" className="btn-primary">Upload Track</Link>
          </div>
        ) : (
          <div className="flex flex-col rounded-2xl border border-border overflow-hidden">
            {/* Header row */}
            <div className="flex items-center gap-4 px-4 py-3 bg-base-elevated text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border">
              <div className="w-10 text-center">#</div>
              <div className="flex-1">Title</div>
              <div className="w-32 hidden md:block">Album</div>
              <div className="w-24 hidden sm:block text-center">Plays</div>
              <div className="w-28 text-center">Status</div>
              <div className="w-8" />
            </div>

            {tracks.map((track, idx) => (
              <div
                key={track.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-base-highlight transition-colors border-b border-border last:border-0 group"
              >
                <div className="w-10 text-center text-sm text-text-secondary">{idx + 1}</div>

                <div className="flex-1 flex flex-col overflow-hidden">
                  <span className="truncate font-medium text-white">{track.title}</span>
                  {track.isExplicit && (
                    <span className="text-[10px] font-bold text-text-secondary">EXPLICIT</span>
                  )}
                </div>

                <div className="w-32 hidden md:block truncate text-sm text-text-secondary">
                  {track.album?.title || <span className="italic">No album</span>}
                </div>

                <div className="w-24 hidden sm:block text-center text-sm text-text-secondary">
                  {(track.playCount || 0).toLocaleString()}
                </div>

                <div className="w-28 flex justify-center">
                  <StatusBadge status={track.status} />
                </div>

                <div className="w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* future: delete button */}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: StudioTrack['status'] }) {
  const map: Record<string, { label: string; classes: string }> = {
    READY:      { label: 'Live',       classes: 'bg-green-500/15 text-green-400 border-green-500/30' },
    PROCESSING: { label: 'Processing', classes: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    PENDING:    { label: 'Pending',    classes: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    FAILED:     { label: 'Failed',     classes: 'bg-red-500/15 text-red-400 border-red-500/30' },
  };
  const { label, classes } = map[status] ?? map['PENDING'];

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}


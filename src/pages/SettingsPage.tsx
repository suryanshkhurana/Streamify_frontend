/**
 * src/pages/SettingsPage.tsx
 *
 * User settings: profile display + "Become an Artist" self-service flow.
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { studioApi } from '@/api/studio';
import EditProfileModal from '@/components/EditProfileModal';

export default function SettingsPage() {
  const { user, setAuth, accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  const [artistName, setArtistName] = useState(user?.displayName ?? '');
  const [artistBio, setArtistBio] = useState('');
  const [showArtistForm, setShowArtistForm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Check if this user already has an artist profile
  const { data: existingArtist, isLoading: checkingArtist } = useQuery({
    queryKey: ['myArtist'],
    queryFn: studioApi.getMyArtist,
    enabled: !!user,
  });

  const isAlreadyArtist = !!existingArtist;

  // Mutation: create artist profile + update local role
  const becomeMutation = useMutation({
    mutationFn: () =>
      studioApi.createArtist({
        name: artistName.trim() || user?.displayName || 'My Artist Profile',
        bio: artistBio.trim() || undefined,
      }),
    onSuccess: (artist) => {
      // Update the in-memory auth store so the sidebar shows "Studio" immediately
      if (user && accessToken) {
        setAuth(accessToken, { ...user, role: 'artist' });
      }
      queryClient.invalidateQueries({ queryKey: ['myArtist'] });
      setShowArtistForm(false);
    },
  });

  return (
    <div className="flex flex-col gap-6 p-8 pb-32 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Settings</h1>
        <p className="mt-1 text-text-secondary">Manage your account and preferences</p>
      </div>

      {/* ── Profile card ── */}
      <div className="rounded-2xl bg-base-elevated border border-border p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Profile</h2>
          <button
            className="btn-ghost text-sm py-1.5 px-3"
            onClick={() => setShowEditProfile(true)}
          >
            Edit
          </button>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-brand overflow-hidden text-3xl font-extrabold text-black uppercase shadow-lg">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              user?.displayName?.[0] ?? '?'
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xl font-bold text-white truncate">{user?.displayName ?? '—'}</p>
            <p className="text-sm text-text-secondary truncate">{user?.email ?? '—'}</p>
            {user?.bio && <p className="text-sm text-text-muted mt-1 truncate">{user.bio}</p>}
            <span className="mt-1.5 inline-block rounded-full bg-base-highlight px-3 py-0.5 text-xs font-semibold capitalize text-text-secondary">
              {user?.role ?? 'user'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Creator Studio section ── */}
      <div className="rounded-2xl bg-base-elevated border border-border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Creator Studio</h2>
            <p className="text-sm text-text-secondary">
              {isAlreadyArtist
                ? 'You have an active artist profile. Upload tracks and manage your discography.'
                : 'Register as an artist to upload music, create albums, and reach listeners.'}
            </p>
          </div>
        </div>

        {checkingArtist ? (
          <div className="mt-4 skeleton h-10 w-40 rounded-pill" />
        ) : isAlreadyArtist ? (
          <div className="mt-4 flex items-center gap-4">
            <Link to="/studio" className="btn-primary">
              Go to Studio →
            </Link>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">{existingArtist.name}</span>
              {existingArtist.bio && (
                <span className="text-xs text-text-secondary line-clamp-1">{existingArtist.bio}</span>
              )}
            </div>
          </div>
        ) : showArtistForm ? (
          <div className="mt-4 flex flex-col gap-4 rounded-xl border border-brand/20 bg-brand/5 p-4">
            <h3 className="font-bold text-white">Set up your artist profile</h3>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Artist Name</label>
              <input
                type="text"
                className="input-base"
                placeholder="Your artist or band name"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                autoFocus
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Bio (optional)</label>
              <textarea
                className="input-base min-h-[80px] resize-none"
                placeholder="Tell listeners about yourself…"
                value={artistBio}
                onChange={(e) => setArtistBio(e.target.value)}
                maxLength={500}
              />
            </div>

            {becomeMutation.isError && (
              <p className="text-sm text-red-400">
                {(becomeMutation.error as Error)?.message || 'Something went wrong. Please try again.'}
              </p>
            )}

            <div className="flex gap-3">
              <button
                className="btn-primary flex-1"
                onClick={() => becomeMutation.mutate()}
                disabled={!artistName.trim() || becomeMutation.isPending}
              >
                {becomeMutation.isPending ? 'Creating…' : '🎤 Become an Artist'}
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowArtistForm(false)}
                disabled={becomeMutation.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="mt-4 btn-primary"
            onClick={() => { setArtistName(user?.displayName ?? ''); setShowArtistForm(true); }}
          >
            🎤 Become an Artist
          </button>
        )}
      </div>

      {/* ── Placeholder sections ── */}
      {['Audio quality', 'Privacy', 'Notifications'].map((section) => (
        <div key={section} className="rounded-2xl bg-base-elevated border border-border p-6">
          <h2 className="mb-4 text-lg font-bold text-white">{section}</h2>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-6 w-10 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {showEditProfile && (
        <EditProfileModal onClose={() => setShowEditProfile(false)} />
      )}
    </div>
  );
}

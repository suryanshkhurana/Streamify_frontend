/**
 * src/pages/LoginPage.tsx
 *
 * Login page — POST /auth/login  +  Google OAuth (SPA code-exchange)
 *
 * Google flow:
 *  1. User clicks "Continue with Google"
 *  2. @react-oauth/google opens a popup, user grants consent
 *  3. Google returns { code } (authorization code)
 *  4. We POST { code, redirectUri } to POST /api/auth/oauth/google
 *  5. Backend exchanges code → issues accessToken + refreshToken cookie
 *  6. We store the token in Zustand and navigate to home
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGoogleLogin } from '@react-oauth/google';

import api from '@/lib/axios';
import { type AuthUser, useAuthStore } from '@/stores/authStore';
import { userApi } from '@/api/user';

// ─── Validation ───────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type LoginFormValues = z.infer<typeof LoginSchema>;

// ─── API shapes ───────────────────────────────────────────────────────────────

interface AuthResponse {
  success: boolean;
  data: { accessToken: string; user: AuthUser };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/';

  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function completeLogin(accessToken: string, basicUser: AuthUser) {
    // Set token so subsequent API calls work
    setAuth(accessToken, basicUser);
    try {
      const profile = await userApi.getMe();
      setAuth(accessToken, {
        ...basicUser,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
      });
    } catch (e) {
      console.warn('Failed to fetch full profile during login', e);
    }
  }

  // ── Email / password form ─────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(LoginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', values);
      await completeLogin(data.data.accessToken, data.data.user);
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setServerError(e.response?.data?.message ?? 'Invalid email or password.');
    }
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async ({ code }) => {
      setGoogleLoading(true);
      setServerError(null);
      try {
        const redirectUri = 'postmessage';
        const { data } = await api.post<AuthResponse>('/auth/oauth/google', {
          code,
          redirectUri,
        });
        await completeLogin(data.data.accessToken, data.data.user);
        navigate(redirectTo, { replace: true });
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        setServerError(e.response?.data?.message ?? 'Google sign-in failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setServerError('Google sign-in was cancelled or failed.');
    },
  });

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand">
            <svg className="h-7 w-7 text-black" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Log in to Streamify</h1>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-base-elevated p-8 shadow-card">

          {/* Server error */}
          {serverError && (
            <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-error">
              {serverError}
            </div>
          )}

          {/* ── Google button ─────────────────────────────────────────────── */}
          <button
            id="login-google"
            type="button"
            onClick={() => googleLogin()}
            disabled={googleLoading || isSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-pill border border-border bg-base-highlight px-6 py-3 text-sm font-semibold text-white transition-all duration-150 hover:border-text-secondary hover:bg-base-press active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {googleLoading ? (
              <span
                className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                style={{ animation: 'spin 0.7s linear infinite' }}
              />
            ) : (
              /* Google "G" logo */
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-muted">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* ── Email / password form ─────────────────────────────────────── */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                autoFocus
                {...register('email')}
                className={['input-base', errors.email ? 'border-error' : ''].join(' ')}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1.5 text-xs text-error">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className={['input-base', errors.password ? 'border-error' : ''].join(' ')}
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1.5 text-xs text-error">{errors.password.message}</p>}
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting || googleLoading}
              className="btn-primary w-full"
            >
              {isSubmitting ? (
                <>
                  <span
                    className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black"
                    style={{ animation: 'spin 0.7s linear infinite' }}
                  />
                  Logging in…
                </>
              ) : (
                'Log In'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-white transition-colors hover:text-brand">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

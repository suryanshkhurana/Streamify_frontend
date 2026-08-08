/**
 * src/pages/studio/StudioUploadPage.tsx
 *
 * Upload a new track to the Streamify platform.
 *
 * Flow:
 *  1. User fills in track metadata (title, album, genre, explicit flag)
 *  2. User drags/drops or selects an audio file
 *  3. On submit:
 *     a. POST /catalog/tracks  → creates PENDING record, returns presigned S3 URL
 *     b. PUT <s3-url>          → uploads file directly to S3 with progress bar
 *     c. POST /catalog/tracks/:id/upload-complete → triggers FFmpeg transcoding
 *  4. Success screen with link to dashboard
 */

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { studioApi } from '@/api/studio';
import type { StudioAlbum } from '@/api/studio';
import { useAuthStore } from '@/stores/authStore';

type UploadStep = 'form' | 'uploading' | 'success' | 'error';

const GENRES = ['Pop', 'Hip-Hop', 'Rock', 'Electronic', 'Jazz', 'R&B', 'Classical', 'Indie', 'Country', 'Metal', 'Bollywood', 'Lo-Fi'];

export default function StudioUploadPage() {
const user = useAuthStore((s) => s.user);
const navigate = useNavigate();
  
  

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<UploadStep>('form');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isExplicit, setIsExplicit] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch my artist profile → albums ──────────────────────────────────────
  const { data: artist } = useQuery({
    queryKey: ['myArtist'],
    queryFn: studioApi.getMyArtist,
  });

  const { data: albums = [] } = useQuery<StudioAlbum[]>({
    queryKey: ['myAlbums', artist?.id],
    queryFn: () => studioApi.getMyAlbums(artist!.id),
    enabled: !!artist?.id,
  });

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('audio/')) {
      setError('Please select an audio file (.mp3, .wav, .flac, .ogg)');
      return;
    }
    if (file.size > 200 * 1024 * 1024) { // 200 MB limit
      setError('File is too large. Maximum size is 200 MB.');
      return;
    }
    setError(null);
    setSelectedFile(file);
    // Auto-fill title if empty
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  }, [title]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre].slice(0, 5)
    );
  };

  // ── Upload mutation ────────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !title.trim()) throw new Error('Title and audio file are required.');

      // Step 1: Create track record → get presigned S3 URL
      setUploadPhase('Creating track record…');
      const { track, uploadUrl } = await studioApi.createTrack({
        title: title.trim(),
        albumId: albumId || undefined,
        genres: selectedGenres,
        isExplicit,
        mimeType: (selectedFile.type as 'audio/mpeg' | 'audio/flac' | 'audio/wav' | 'audio/ogg') || 'audio/mpeg',
        fileSizeBytes: selectedFile.size,
      });

      // Step 2: Upload directly to S3
      setUploadPhase('Uploading to cloud storage…');
      await studioApi.uploadFileToS3(uploadUrl, selectedFile, (pct) => {
        setUploadProgress(pct);
      });

      // Step 3: Notify backend → kicks off FFmpeg transcoding via RabbitMQ
      setUploadPhase('Starting transcoder…');
      await studioApi.markUploadComplete(track.id);

      return track;
    },
    onMutate: () => {
      setStep('uploading');
      setUploadProgress(0);
      setError(null);
    },
    onSuccess: () => {
      setStep('success');
    },
    onError: (err: Error) => {
      setError(err.message || 'Upload failed. Please try again.');
      setStep('error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { setError('Please select an audio file.'); return; }
    if (!title.trim()) { setError('Please enter a track title.'); return; }
    uploadMutation.mutate();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Success
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4 md:p-8 animate-fade-in text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-5xl">
          ✅
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white">Upload Successful!</h1>
          <p className="mt-3 text-text-secondary max-w-md">
            Your track has been uploaded and is now being transcoded into streaming format.
            This usually takes <strong className="text-white">1–3 minutes</strong>.
            It will appear as <strong className="text-white">"Live"</strong> on your dashboard once ready.
          </p>
        </div>
        <div className="flex gap-4">
          <Link to="/studio" className="btn-primary">Go to Dashboard</Link>
          <button
            className="btn-ghost"
            onClick={() => {
              setStep('form');
              setSelectedFile(null);
              setTitle('');
              setAlbumId('');
              setSelectedGenres([]);
              setIsExplicit(false);
              setUploadProgress(0);
            }}
          >
            Upload Another
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Uploading
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 'uploading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 p-8 animate-fade-in text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/20">
          <svg className="h-10 w-10 text-brand animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-white mb-2">{uploadPhase}</h2>
          <p className="text-text-secondary mb-6">Please don't close this tab.</p>
          <div className="w-full bg-base-highlight rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-brand transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-text-secondary">{uploadProgress}%</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Form
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8 p-8 pb-32 animate-fade-in max-w-3xl">

      {/* Header */}
      <div>
        <Link to="/studio" className="text-sm text-text-secondary hover:text-white transition-colors mb-2 inline-flex items-center gap-1">
          ← Back to Studio
        </Link>
        <h1 className="text-4xl font-extrabold tracking-tight text-white mt-2">Upload a Track</h1>
        <p className="mt-2 text-text-secondary">
          Upload your audio file and fill in the track details. We'll handle the rest.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">

        {/* ── Drop Zone ── */}
        <div
          className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200
            ${isDragOver ? 'border-brand bg-brand/10 scale-[1.01]' : 'border-border bg-base-elevated hover:border-brand/50 hover:bg-base-highlight'}
            ${selectedFile ? 'border-brand/50 bg-green-500/5' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/wav,audio/flac,audio/ogg,.mp3,.wav,.flac,.ogg"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
          />

          {selectedFile ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-3xl">✅</div>
              <div>
                <p className="font-bold text-white text-lg">{selectedFile.name}</p>
                <p className="text-sm text-text-secondary mt-1">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB · {selectedFile.type || 'audio'}
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-brand hover:text-brand-hover font-semibold"
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
              >
                Change file
              </button>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
                <svg className="h-8 w-8 text-brand" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-white">Drag & drop your audio file here</p>
                <p className="text-text-secondary mt-1">or <span className="text-brand font-semibold">browse files</span></p>
                <p className="text-xs text-text-muted mt-2">Supports MP3, WAV, FLAC, OGG · Max 200 MB</p>
              </div>
            </>
          )}
        </div>

        {/* ── Track Details ── */}
        <div className="rounded-2xl bg-base-elevated border border-border p-6 flex flex-col gap-5">
          <h2 className="text-lg font-bold text-white">Track Details</h2>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              Track Title <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              className="input-base"
              placeholder="Enter track title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={300}
            />
          </div>

          {/* Album */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">Album (optional)</label>
            <select
              className="input-base cursor-pointer"
              value={albumId}
              onChange={(e) => setAlbumId(e.target.value)}
            >
              <option value="">No album (single)</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>{album.title}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-text-muted">
              Don't have an album yet?{' '}
              <Link to="/studio/albums" className="text-brand hover:underline">Create one first →</Link>
            </p>
          </div>

          {/* Genres */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              Genres <span className="text-text-muted">(pick up to 5)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                    selectedGenres.includes(genre)
                      ? 'bg-brand text-black'
                      : 'bg-base-highlight text-text-secondary hover:text-white'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Explicit */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Explicit Content</p>
              <p className="text-sm text-text-secondary">Mark if this track contains explicit language.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isExplicit}
              onClick={() => setIsExplicit((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                isExplicit ? 'bg-brand' : 'bg-base-highlight'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  isExplicit ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Error */}
        {(error || step === 'error') && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error || 'An unexpected error occurred. Please try again.'}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={!selectedFile || !title.trim() || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? 'Uploading…' : '🚀 Upload Track'}
          </button>
          <Link to="/studio" className="btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

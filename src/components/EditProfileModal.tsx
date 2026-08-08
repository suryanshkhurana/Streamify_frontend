import { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { userApi } from '@/api/user';
import { useAuthStore } from '@/stores/authStore';

interface EditProfileModalProps {
  onClose: () => void;
}

type UploadStage = 'idle' | 'requesting-url' | 'uploading' | 'confirming' | 'done';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function EditProfileModal({ onClose }: EditProfileModalProps) {
  const { user, setAuth, accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');

  // Avatar upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(user?.avatarUrl || '');
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File selection logic ──────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    setUploadError('');
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError('File is too large. Maximum size is 5 MB.');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be reselected
    e.target.value = '';
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  // ── S3 presigned upload flow ──────────────────────────────────────────────
  const uploadAvatar = async (): Promise<string | null> => {
    if (!selectedFile || !user?.id) return null;

    // Step 1: get presigned URL from backend
    setUploadStage('requesting-url');
    setUploadProgress(0);
    const { uploadUrl, s3Key } = await userApi.getProfilePictureUploadUrl(
      user.id,
      selectedFile.type,
      selectedFile.size,
    );

    // Step 2: PUT file directly to S3 (bypasses our server for performance)
    setUploadStage('uploading');
    await axios.put(uploadUrl, selectedFile, {
      headers: { 'Content-Type': selectedFile.type },
      onUploadProgress: (evt) => {
        if (evt.total) {
          setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    });

    // Step 3: confirm — backend validates magic bytes and updates MongoDB
    setUploadStage('confirming');
    const { avatarUrl } = await userApi.confirmProfilePictureUpload(user.id, s3Key);
    setUploadStage('done');
    return avatarUrl;
  };

  // ── Profile text update ───────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async () => {
      // Upload photo first (if a new one was picked), then save text fields
      let newAvatarUrl: string | null = null;
      if (selectedFile) {
        newAvatarUrl = await uploadAvatar();
      }

      // Sync with catalog-service if the user is an artist
      if (user?.role === 'artist') {
        try {
          const { catalogApi } = await import('@/api/catalog');
          await catalogApi.updateMyArtist({
            bio: bio.trim(),
            ...(newAvatarUrl ? { avatarUrl: newAvatarUrl, coverUrl: newAvatarUrl } : {}),
          });
        } catch (e) {
          console.warn('Failed to sync artist profile with catalog service:', e);
        }
      }

      return userApi.updateMe({
        displayName: displayName.trim(),
        bio: bio.trim(),
        ...(newAvatarUrl ? { avatarUrl: newAvatarUrl } : {}),
      });
    },
    onSuccess: (updatedProfile) => {
      if (user && accessToken) {
        setAuth(accessToken, {
          ...user,
          displayName: updatedProfile.displayName,
          avatarUrl: updatedProfile.avatarUrl,
          bio: updatedProfile.bio,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['me'] });
      onClose();
    },
    onError: (err) => {
      setUploadStage('idle');
      setUploadError((err as Error)?.message || 'Upload failed. Please try again.');
    },
  });

  const isBusy = mutation.isPending || uploadStage !== 'idle';

  const stageLabel: Record<UploadStage, string> = {
    idle: 'Save',
    'requesting-url': 'Preparing…',
    uploading: `Uploading ${uploadProgress}%`,
    confirming: 'Verifying…',
    done: 'Saved!',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-base-elevated border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            disabled={isBusy}
            className="rounded-full p-2 text-text-secondary hover:bg-base-highlight hover:text-white transition-colors disabled:opacity-40"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!displayName.trim()) return;
            mutation.mutate();
          }}
          className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto"
        >
          {/* ── Avatar upload zone ─────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-3">
            {/* Preview ring */}
            <div
              className={`relative h-24 w-24 rounded-full overflow-hidden ring-2 transition-all ${
                isDragging ? 'ring-brand scale-105' : 'ring-border'
              } cursor-pointer group`}
              onClick={() => !isBusy && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              title="Click or drag & drop to change photo"
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Avatar Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-extrabold text-black bg-brand">
                  {displayName[0]?.toUpperCase() ?? '?'}
                </div>
              )}

              {/* Hover overlay with camera icon */}
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="h-6 w-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-white text-[10px] font-semibold">Change</span>
              </div>

              {/* Upload progress ring overlay */}
              {uploadStage === 'uploading' && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{uploadProgress}%</span>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onFileInputChange}
              disabled={isBusy}
            />

            <div className="text-center">
              <button
                type="button"
                className="btn-ghost text-xs py-1 px-3"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
              >
                {selectedFile ? 'Change photo' : 'Upload photo'}
              </button>
              <p className="text-[11px] text-text-muted mt-0.5">JPEG, PNG or WebP · max 5 MB</p>
            </div>

            {selectedFile && (
              <p className="text-xs text-brand font-medium truncate max-w-[240px]">
                ✓ {selectedFile.name} ({(selectedFile.size / 1_048_576).toFixed(1)} MB)
              </p>
            )}
          </div>

          {/* ── Name ──────────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">Name</label>
            <input
              type="text"
              className="input-base"
              placeholder="Your Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              required
              disabled={isBusy}
            />
          </div>

          {/* ── Bio ───────────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">Bio</label>
            <textarea
              className="input-base min-h-[80px] resize-none"
              placeholder="A short bio about yourself…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              disabled={isBusy}
            />
          </div>

          {/* ── Errors ────────────────────────────────────────────────────── */}
          {(uploadError || mutation.isError) && (
            <p className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">
              {uploadError || (mutation.error as Error)?.message || 'Something went wrong.'}
            </p>
          )}

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={onClose}
              disabled={isBusy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary min-w-[110px]"
              disabled={!displayName.trim() || isBusy}
            >
              {isBusy ? stageLabel[uploadStage] : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

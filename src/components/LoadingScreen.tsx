/**
 * src/components/LoadingScreen.tsx
 *
 * Full-viewport loading screen shown during the initial silent session restore.
 */

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base">
      {/* Animated brand logo */}
      <div className="flex flex-col items-center gap-6">
        {/* Spinning green ring */}
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-base-highlight" />
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand"
            style={{ animation: 'spin 0.9s linear infinite' }}
          />
        </div>

        {/* Wordmark */}
        <p className="text-lg font-bold tracking-widest text-text-secondary">
          STREAMIFY
        </p>
      </div>
    </div>
  );
}

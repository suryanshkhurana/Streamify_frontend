/** src/pages/NotFoundPage.tsx — 404 fallback. */
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-base px-4 text-center animate-fade-in">
      <p className="text-8xl font-extrabold text-text-muted">404</p>
      <h1 className="text-3xl font-extrabold text-white">Page not found</h1>
      <p className="max-w-sm text-text-secondary">
        Looks like the page you are looking for has gone missing or never existed.
      </p>
      <Link to="/" className="btn-primary mt-2">
        Go home
      </Link>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { catalogApi } from '@/api/catalog';

export default function DiscoverPage() {
  const { data: artists = [], isLoading } = useQuery({
    queryKey: ['discoverArtists'],
    queryFn: catalogApi.getArtists,
  });

  return (
    <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-8 animate-fade-in pb-32">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Discover</h1>
        <p className="mt-1 text-text-secondary">Explore all artists and their music</p>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-bold text-white tracking-tight">Artists</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <div className="skeleton aspect-square w-full rounded-full bg-base-highlight" />
                <div className="skeleton h-4 w-3/4 mx-auto rounded" />
              </div>
            ))}
          </div>
        ) : artists.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                to={`/artist/${artist.id}`}
                className="group relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-xl border border-transparent p-4 transition-all hover:bg-base-highlight hover:shadow-xl hover:border-border"
              >
                <div className="relative mx-auto aspect-square w-full max-w-[200px] overflow-hidden rounded-full shadow-lg bg-base-elevated border-4 border-base group-hover:border-base-elevated transition-colors">
                  {artist.avatarUrl || artist.coverUrl ? (
                    <img
                      src={artist.avatarUrl || artist.coverUrl!}
                      alt={artist.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-base-highlight text-4xl text-text-secondary">
                      🎤
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-black shadow-xl hover:scale-105">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 ml-1">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-white text-lg group-hover:text-brand transition-colors">{artist.name}</h3>
                  <span className="mt-1 block text-sm text-text-secondary font-medium">Artist</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-base-elevated p-8 text-center">
            <p className="text-text-secondary">No artists found in the database yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}

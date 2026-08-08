import { api } from '@/lib/axios';
import type { Album, Artist, CatalogTrack } from './catalog';

// ─── Types ───────────────────────────────────────────────────────────────────

/** A track result from ES (has flat fields) or from catalog fallback (nested fields) */
export interface SearchTrack {
  id: string;
  title: string;
  artistId?: string;
  artistName?: string;
  artist?: { id: string; name: string };
  albumTitle?: string;
  album?: { id: string; title: string; coverUrl: string | null };
  coverUrl?: string | null;
  durationMs?: number;
  playCount?: number;
}

export interface SearchArtist {
  id: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface SearchAlbum {
  id: string;
  title: string;
  artistId?: string;
  artistName?: string;
  artist?: { id: string; name: string };
  coverUrl?: string | null;
}

export interface SearchResult {
  tracks: SearchTrack[];
  artists: SearchArtist[];
  albums: SearchAlbum[];
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const searchApi = {
  /**
   * Typeahead suggestions — fast, limited results.
   * Hits search-service /search/suggest?q=...
   */
  getSearchSuggestions: async (query: string): Promise<SearchResult> => {
    if (!query.trim()) return { tracks: [], artists: [], albums: [] };
    try {
      const { data } = await api.get(`/search/suggest?q=${encodeURIComponent(query)}`);
      return data.data as SearchResult;
    } catch {
      return { tracks: [], artists: [], albums: [] };
    }
  },

  /**
   * Full search results.
   * Hits search-service /search?q=...
   */
  getSearchResults: async (query: string): Promise<SearchResult> => {
    if (!query.trim()) return { tracks: [], artists: [], albums: [] };
    try {
      const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
      return data.data as SearchResult;
    } catch {
      return { tracks: [], artists: [], albums: [] };
    }
  },
};

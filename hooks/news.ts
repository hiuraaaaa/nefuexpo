// hooks/news.ts
// Fetch anime news dari Jikan (MyAnimeList unofficial API) — gratis, no key

const JIKAN_BASE = 'https://api.jikan.moe/v4';

export interface NewsItem {
  mal_id: number;
  url: string;
  title: string;
  date: string;           // ISO 8601
  author_username: string;
  author_url: string;
  forum_url: string;
  images: {
    jpg: { image_url: string | null };
  };
  comments: number;
  excerpt: string;
}

export interface NewsResponse {
  data: NewsItem[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: { count: number; total: number; per_page: number };
  };
}

// Format ISO date -> "3 Mei 2024" atau "2 hari lalu"
export const formatNewsDate = (iso: string): string => {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Baru saja';
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

// Fetch latest anime news (page 1 by default)
export const fetchAnimeNews = async (page = 1): Promise<NewsResponse> => {
  const res = await fetch(`${JIKAN_BASE}/news/anime?page=${page}`);
  if (!res.ok) throw new Error(`Jikan error: ${res.status}`);
  return res.json();
};


// hooks/news.ts
// Fetch anime news dari MyAnimeList RSS feed — gratis, no key, no rate limit

const MAL_RSS = 'https://myanimelist.net/rss/news.xml';
// Proxy buat bypass CORS di mobile (react-native fetch langsung ke RSS harusnya ok)

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

// Parse XML RSS feed jadi array NewsItem
const parseRSS = (xml: string): NewsItem[] => {
  const items: NewsItem[] = [];

  // Extract semua <item> block
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];

  itemMatches.forEach((block, index) => {
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? (m[1] ?? m[2] ?? '').trim() : '';
    };

    const title   = get('title');
    const url     = get('link') || get('guid');
    const date    = get('pubDate');
    const excerpt = get('description').replace(/<[^>]+>/g, '').slice(0, 200);

    // Ambil image dari <enclosure> atau <media:content> atau <image> di dalam description
    let imageUrl: string | null = null;
    const enclosure = block.match(/url="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i);
    if (enclosure) imageUrl = enclosure[1];
    if (!imageUrl) {
      const imgTag = block.match(/<img[^>]+src="([^"]+)"/i);
      if (imgTag) imageUrl = imgTag[1];
    }

    // Extract author dari <dc:creator> atau <author>
    const author = get('dc:creator') || get('author') || 'MAL';

    // Unique id dari url
    const malId = index + 1;

    if (title && url) {
      items.push({
        mal_id:          malId,
        url,
        title,
        date:            date ? new Date(date).toISOString() : new Date().toISOString(),
        author_username: author,
        author_url:      `https://myanimelist.net/profile/${author}`,
        forum_url:       url,
        images:          { jpg: { image_url: imageUrl } },
        comments:        0,
        excerpt,
      });
    }
  });

  return items;
};

// RSS feed MAL hanya punya 1 page, pagination dummy
export const fetchAnimeNews = async (_page = 1): Promise<NewsResponse> => {
  const res = await fetch(MAL_RSS, {
    headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' },
  });
  if (!res.ok) throw new Error(`RSS error: ${res.status}`);
  const xml = await res.text();
  const data = parseRSS(xml);

  return {
    data,
    pagination: {
      last_visible_page: 1,
      has_next_page:     false,
      current_page:      1,
      items: { count: data.length, total: data.length, per_page: data.length },
    },
  };
};

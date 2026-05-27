// hooks/news.ts
const MAL_RSS = 'https://myanimelist.net/rss/news.xml';

export interface NewsItem {
  mal_id: number;
  url: string;
  title: string;
  date: string;
  author_username: string;
  author_url: string;
  forum_url: string;
  images: { jpg: { image_url: string | null } };
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
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return iso; }
};

// Decode HTML entities
const decodeEntities = (str: string): string =>
  str
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'");

const parseRSS = (xml: string): NewsItem[] => {
  const items: NewsItem[] = [];
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];

  itemMatches.forEach((block, index) => {
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? (m[1] ?? m[2] ?? '').trim() : '';
    };

    const title   = decodeEntities(get('title'));
    const url     = get('link') || get('guid');
    const date    = get('pubDate');
    const excerpt = decodeEntities(get('description').replace(/<[^>]+>/g, '').trim().slice(0, 200));

    // Coba ambil image dari dalam <description> CDATA (MAL taruh <img> di sana)
    const desc = get('description');
    let imageUrl: string | null = null;
    const imgInDesc = desc.match(/<img[^>]+src="([^"]+)"/i);
    if (imgInDesc) imageUrl = imgInDesc[1];

    // Fallback: enclosure tag
    if (!imageUrl) {
      const enclosure = block.match(/url="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i);
      if (enclosure) imageUrl = enclosure[1];
    }

    const author = get('dc:creator') || get('author') || 'MAL';

    if (title && url) {
      items.push({
        mal_id: index + 1,
        url,
        title,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        author_username: author,
        author_url: `https://myanimelist.net/profile/${author}`,
        forum_url: url,
        images: { jpg: { image_url: imageUrl } },
        comments: 0,
        excerpt,
      });
    }
  });

  return items;
};

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
      has_next_page: false,
      current_page: 1,
      items: { count: data.length, total: data.length, per_page: data.length },
    },
  };
};

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

const decodeEntities = (str: string): string =>
  str
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'");

const extractImage = (block: string, xml: string, index: number): string | null => {
  // Coba semua kemungkinan format
  const patterns = [
    /<media:thumbnail[^>]+url="([^"]+)"/i,   // <media:thumbnail url="...">
    /<media:thumbnail[^>]+url='([^']+)'/i,   // single quote
    /<thumbnail[^>]+url="([^"]+)"/i,          // namespace di-strip jadi <thumbnail>
    /<enclosure[^>]+url="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i, // <enclosure>
    /<img[^>]+src="(https?:\/\/cdn\.myanimelist[^"]+)"/i,      // <img> dari CDN MAL
    /https?:\/\/cdn\.myanimelist\.net\/s\/common\/uploaded_files\/[^\s"<>]+\.jpeg/i, // URL CDN langsung
  ];

  for (const pattern of patterns) {
    const m = block.match(pattern);
    if (m) {
      console.log(`[NEWS] item ${index} matched pattern: ${pattern}`);
      return m[1];
    }
  }

  // Log 50 char sekitar kata "thumbnail" buat debug
  const thumbIdx = block.toLowerCase().indexOf('thumbnail');
  if (thumbIdx !== -1) {
    console.log(`[NEWS] item ${index} thumbnail context: ${block.slice(Math.max(0, thumbIdx - 10), thumbIdx + 60)}`);
  } else {
    console.log(`[NEWS] item ${index} NO thumbnail tag found in block`);
  }

  return null;
};

const parseRSS = (xml: string): NewsItem[] => {
  const items: NewsItem[] = [];
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];

  console.log(`[NEWS] Total items: ${itemMatches.length} | has thumbnail: ${xml.includes('thumbnail')}`);

  itemMatches.forEach((block, index) => {
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? (m[1] ?? m[2] ?? '').trim() : '';
    };

    const title   = decodeEntities(get('title'));
    const url     = get('link') || get('guid');
    const date    = get('pubDate');
    const excerpt = decodeEntities(get('description').replace(/<[^>]+>/g, '').trim().slice(0, 200));
    const imageUrl = extractImage(block, xml, index);
    const author  = get('dc:creator') || get('author') || 'MAL';

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
  try {
    console.log('[NEWS] Fetching RSS...');
    const res = await fetch(MAL_RSS, {
      headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' },
    });
    console.log(`[NEWS] Status: ${res.status}`);
    if (!res.ok) throw new Error(`RSS error: ${res.status}`);
    const xml = await res.text();
    console.log(`[NEWS] XML length: ${xml.length} | snippet: ${xml.slice(0, 200)}`);
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
  } catch (e: any) {
    console.error(`[NEWS] Error: ${e.message}`);
    throw e;
  }
};

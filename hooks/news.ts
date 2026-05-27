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

// ========== PERBAIKAN UTAMA DI SINI ==========
const extractImage = (block: string, index: number): string | null => {
  // 1. Format: <media:thumbnail>URL</media:thumbnail> (yang benar untuk MAL)
  let match = block.match(/<media:thumbnail>([^<]+)<\/media:thumbnail>/i);
  if (match) {
    console.log(`[NEWS] item ${index} matched <media:thumbnail> tag content`);
    return match[1];
  }
  
  // 2. Fallback: <media:thumbnail url="..."> (format alternate)
  match = block.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i);
  if (match) {
    console.log(`[NEWS] item ${index} matched media:thumbnail url attribute`);
    return match[1];
  }
  
  // 3. Fallback: <thumbnail>URL</thumbnail>
  match = block.match(/<thumbnail>([^<]+)<\/thumbnail>/i);
  if (match) return match[1];
  
  // 4. Fallback: enclosure dengan image extension
  match = block.match(/<enclosure[^>]*url=["']([^"']+\.(jpg|jpeg|png|webp))["']/i);
  if (match) return match[1];
  
  // 5. Fallback: cari URL CDN langsung
  match = block.match(/https?:\/\/cdn\.myanimelist\.net\/s\/common\/uploaded_files\/[^\s"<>]+\.(jpeg|jpg|png)/i);
  if (match) return match[0];
  
  console.log(`[NEWS] item ${index} no image found`);
  return null;
};
// ============================================

const parseRSS = (xml: string): NewsItem[] => {
  const items: NewsItem[] = [];
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];

  console.log(`[NEWS] Total items: ${itemMatches.length}`);

  itemMatches.forEach((block, index) => {
    // Helper dengan dukungan CDATA
    const get = (tag: string) => {
      // Coba dengan CDATA dulu
      let m = block.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`));
      if (m) return m[1].trim();
      // Tanpa CDATA
      m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
      if (m) return m[1].trim();
      return '';
    };
    
    // Untuk tag dengan namespace (seperti dc:creator)
    const getNs = (ns: string, local: string) => {
      const pattern = new RegExp(`<${ns}:${local}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${ns}:${local}>|<${ns}:${local}>([\\s\\S]*?)</${ns}:${local}>`);
      const m = block.match(pattern);
      return m ? (m[1] ?? m[2] ?? '').trim() : '';
    };

    const title   = decodeEntities(get('title'));
    const url     = get('link') || get('guid');
    const date    = get('pubDate');
    const excerpt = decodeEntities(get('description').replace(/<[^>]+>/g, '').trim().slice(0, 200));
    const imageUrl = extractImage(block, index);
    const author  = getNs('dc', 'creator') || get('author') || 'MAL News';

    if (title && url) {
      items.push({
        mal_id: index + 1,
        url,
        title,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        author_username: author,
        author_url: `https://myanimelist.net/profile/${encodeURIComponent(author)}`,
        forum_url: url,
        images: { jpg: { image_url: imageUrl } },
        comments: 0,
        excerpt: excerpt || title.slice(0, 100),
      });
    }
  });

  return items;
};

export const fetchAnimeNews = async (_page = 1): Promise<NewsResponse> => {
  try {
    console.log('[NEWS] Fetching RSS...');
    const res = await fetch(MAL_RSS, {
      headers: { 
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'Mozilla/5.0 (compatible; AnimeApp/1.0)' // Disarankan
      },
    });
    console.log(`[NEWS] Status: ${res.status}`);
    if (!res.ok) throw new Error(`RSS error: ${res.status}`);
    const xml = await res.text();
    console.log(`[NEWS] XML length: ${xml.length}`);
    const data = parseRSS(xml);
    
    console.log(`[NEWS] Berhasil parse ${data.length} item, dengan gambar: ${data.filter(d => d.images.jpg.image_url).length}`);

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

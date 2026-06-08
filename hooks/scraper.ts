/**
 * scraper.ts — Scrape langsung ke Otakudesu, tanpa server perantara.
 * Drop-in replacement untuk hooks/api.ts
 *
 * Ganti satu baris di semua screen:
 *   import { api, ... } from '@/hooks/api'
 *   → import { api, ... } from '@/hooks/scraper'
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { ApiResponse, Anime, AnimeDetail, ScheduleDay, Genre } from '@/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const UA =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

// Domain dinamis — diambil dari repo AniFlix, bisa ganti ke repo lu sendiri
const DOMAIN_URL =
  'https://raw.githubusercontent.com/FightFarewellFearless/AniFlix/master/SCRAPE_DOMAIN.txt';

let BASE = 'https://otakudesu.blog';

/** Fetch domain terbaru dari remote. Panggil sekali saat app start. */
export const refreshDomain = async (): Promise<void> => {
  try {
    const res = await fetch(DOMAIN_URL);
    const text = (await res.text()).trim();
    if (text && text !== '404: Not Found') {
      BASE = 'https://' + text;
    }
  } catch {
    // fallback ke default
  }
};

const PAGE_SIZE = 24;

// ─── HTTP helper ──────────────────────────────────────────────────────────────

const get = async (url: string): Promise<string> => {
  const res = await axios.get<string>(url, {
    timeout: 30_000,
    headers: {
      'User-Agent': UA,
      'Accept-Encoding': 'gzip, deflate',
    },
  });
  return res.data;
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

function makeAnime(params: {
  id: string;
  title: string;
  thumbnail: string;
  episode?: string;
  releaseDate?: string;
  releaseDay?: string;
  status?: string;
  rating?: string;
  type?: string;
  studio?: string;
  synopsis?: string;
  genres?: string;
  year?: string;
}): Anime {
  return {
    id:           params.id,
    title:        params.title,
    image_poster: params.thumbnail,
    image_cover:  params.thumbnail,
    synopsis:     params.synopsis ?? '',
    type:         params.type ?? '',
    status:       params.status ?? 'ONGOING',
    year:         params.year ?? params.releaseDate ?? '',
    aired_start:  params.releaseDate ?? '',
    studio:       params.studio ?? '',
    genre:        params.genres ?? '',
    day:          params.releaseDay ?? '',
    time:         '',
    key_time:     (params.releaseDay ?? '').toUpperCase(),
  };
}

// ─── Scrapers ─────────────────────────────────────────────────────────────────

/** Ongoing anime, page mulai dari 1 */
const scrapeOngoing = async (page = 1): Promise<Anime[]> => {
  const html = await get(`${BASE}/ongoing-anime/page/${page}`);
  const $ = cheerio.load(html);
  const results: Anime[] = [];
  $('div.venz > ul li').each((_, el) => {
    const d = $(el).find('div.detpost');
    const link = d.find('div.thumb > a').attr('href') ?? '';
    const title = d.find('h2.jdlflm').text().trim();
    const thumbnail = d.find('div.thumbz > img').attr('src') ?? '';
    const episode = d.find('div.epz').text().trim();
    const releaseDate = d.find('div.newnime').text().trim();
    const releaseDay = d.find('div.epztipe').text().trim();
    if (title && link) {
      results.push(makeAnime({ id: link, title, thumbnail, episode, releaseDate, releaseDay }));
    }
  });
  return results;
};

/** Search anime */
const scrapeSearch = async (query: string): Promise<Anime[]> => {
  const html = await get(`${BASE}/?s=${encodeURIComponent(query)}&post_type=anime`);
  const $ = cheerio.load(html);
  const results: Anime[] = [];
  $('div.vezone > div.venser > div.venutama > div.page > ul li').each((_, el) => {
    const item = $(el);
    const link = item.find('h2 > a').attr('href') ?? '';
    const title = item.find('h2 > a').text().trim();
    const thumbnail = item.find('img').attr('src') ?? '';
    const status = item.find('div.set').eq(1).text().replace('Status : ', '').trim();
    const rating = item.find('div.set').eq(2).text().replace('Rating : ', '').trim();
    const genres: string[] = [];
    item.find('div.set').eq(0).find('a').each((_, a) => genres.push($(a).text().trim()));
    if (title && link) {
      results.push(makeAnime({ id: link, title, thumbnail, status, rating, genres: genres.join(', ') }));
    }
  });
  return results;
};

/** Jadwal rilis */
const scrapeSchedule = async (): Promise<ScheduleDay> => {
  const html = await get(`${BASE}/jadwal-rilis/`);
  const $ = cheerio.load(html);
  const jadwal: ScheduleDay = {};
  $('div.kglist321').each((_, el) => {
    const container = $(el);
    const day = container.find('h2').text().trim().toUpperCase();
    const list: Anime[] = [];
    container.find('ul li > a').each((_, a) => {
      const link = $(a).attr('href') ?? '';
      const title = $(a).text().trim();
      if (title && link) list.push(makeAnime({ id: link, title, thumbnail: '' }));
    });
    jadwal[day] = list;
  });
  return jadwal;
};

/** Semua list anime (A-Z) */
const scrapeAnimeList = async (): Promise<Anime[]> => {
  const html = await get(`${BASE}/anime-list/`);
  const $ = cheerio.load(html);
  const results: Anime[] = [];
  $('div.jdlbar').each((_, el) => {
    const a = $(el).find('a');
    const link = a.attr('href') ?? '';
    const title = a.text().trim();
    if (title && link) results.push(makeAnime({ id: link, title, thumbnail: '' }));
  });
  return results;
};

/** Detail anime (halaman /anime/xxx/) */
const scrapeDetail = async (url: string): Promise<AnimeDetail | null> => {
  // Pastiin domain selalu pakai BASE terbaru
  try {
    const urlObj = new URL(url);
    url = BASE + urlObj.pathname;
  } catch { /* url invalid, skip */ }

  const html = await get(url);
  const $ = cheerio.load(html);

  const isDetail = $('div.episodelist').length === 3;
  if (!isDetail) return null;

  const venser = $('div.venser');
  const filmStats = venser.find('div.infozin > div.infozingle');

  const getInfo = (idx: number) =>
    filmStats.find('p').eq(idx).text().split(':').slice(1).join(':').trim();

  const title = venser.find('div.jdlrx').text().trim();
  const thumbnail = $('div.fotoanime > img').attr('src') ?? '';
  const synopsis: string[] = [];
  venser.find('div.sinopc p').each((_, el) => synopsis.push($(el).text().trim()));

  const genres: string[] = [];
  filmStats.find('p').eq(10).find('a').each((_, el) => genres.push($(el).text().trim()));

  const episodeList: AnimeDetail['episode_list'] = [];
  venser.find('div.episodelist').eq(1).find('ul li').each((i, el) => {
    const epLink = $(el).find('a').attr('href') ?? '';
    const epTitle = $(el).find('a').text().trim();
    episodeList.push({ id: epLink, index: i, title: epTitle });
  });
  // Balik urutan — Otakudesu urutan terbaru di atas, kita mau ep 1 dulu
  episodeList.reverse();

  const base: Anime = makeAnime({
    id:        url,
    title,
    thumbnail,
    synopsis:  synopsis.join('\n'),
    rating:    getInfo(2),
    status:    getInfo(5),
    type:      getInfo(4),
    studio:    getInfo(9),
    genres:    genres.join(', '),
    year:      getInfo(8).split(' ').pop() ?? '',
  });

  return { ...base, episode_list: episodeList };
};

/** Episode / streaming (halaman /episode/xxx/) */
const scrapeEpisode = async (url: string): Promise<{ status: boolean; data: { server: any[] } }> => {
  try {
    const urlObj = new URL(url);
    url = BASE + urlObj.pathname;
  } catch { /* skip */ }

  const html = await get(url);
  const $ = cheerio.load(html);
  const venser = $('div.venser');

  // Coba embed iframe dulu (paling simpel)
  const iframeSrc = venser.find('div.responsive-embed-stream > iframe').attr('src') ?? '';

  // Mirror stream dengan dataContent (butuh resolve ke direct link)
  const mirrorStream = venser.find('div.mirrorstream ul');
  const servers: any[] = [];

  (['m360p', 'm480p', 'm720p'] as const).forEach(res => {
    const label = res.replace('m', '');
    mirrorStream
      .filter((_, el) => $(el).hasClass(res))
      .find('a')
      .each((i, el) => {
        const text = $(el).text().trim();
        const dataContent = $(el).attr('data-content') ?? '';
        // Filter hanya server yang bisa di-resolve (bukan mega/gdrive)
        const isPlayable =
          text.includes('desu') ||
          text.includes('pdrain') ||
          text.includes('filedon') ||
          text.includes('odstream') ||
          text.includes('moedesu');
        if (isPlayable && dataContent) {
          servers.push({
            id:          `${res}-${i}`,
            quality:     label,
            label:       text,
            dataContent,
            type:        'resolve', // perlu di-resolve dulu via admin-ajax
          });
        }
      });
  });

  // Kalau ada server yg bisa di-resolve, resolve yg pertama langsung
  let resolvedServer: any[] = [];
  if (servers.length > 0) {
    try {
      const direct = await resolveStreamLink(servers[0].dataContent, url);
      if (direct) {
        resolvedServer = [{
          id:      servers[0].id,
          quality: servers[0].quality,
          link:    direct,
          type:    direct.includes('.m3u8') ? 'hls' : 'direct',
        }];
        // Sisanya tetap kirim sebagai fallback (belum di-resolve)
        servers.slice(1).forEach(s => {
          resolvedServer.push({
            id:      s.id,
            quality: s.quality,
            link:    '', // kosong, resolve on-demand kalau mau
            label:   s.label,
            dataContent: s.dataContent,
            type:    'resolve',
          });
        });
      }
    } catch { /* gagal resolve, fallback ke iframe */ }
  }

  // Fallback: kalau semua gagal, pakai embed iframe
  if (resolvedServer.length === 0 && iframeSrc) {
    resolvedServer = [{
      id:      'embed-0',
      quality: 'AUTO',
      link:    iframeSrc,
      type:    'embed',
    }];
  }

  return { status: true, data: { server: resolvedServer } };
};

// ─── Resolve direct stream link ───────────────────────────────────────────────

/**
 * Decode dataContent (base64) → hit admin-ajax.php → dapet iframe → extract direct URL
 * Flow sama persis kayak AniFlix fetchStreamingResolution()
 */
const resolveStreamLink = async (dataContent: string, pageUrl: string): Promise<string | undefined> => {
  // Step 1: Ambil nonce
  const nonceRes = await axios.post<any>(
    `${BASE}/wp-admin/admin-ajax.php`,
    { action: 'aa1208d27f29ca340c92c66d1926f13f' }, // reqNonceAction — bisa berubah, ambil dari HTML
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: pageUrl,
      },
      timeout: 15_000,
    },
  );
  const nonce: string = nonceRes.data?.data;
  if (!nonce) return undefined;

  // Step 2: Decode dataContent dari base64
  const decoded = JSON.parse(Buffer.from(dataContent, 'base64').toString('utf8'));

  // Step 3: Ambil action dari HTML (reqResolutionWithNonceAction) — ambil dinamis
  const pageHtml = await get(pageUrl);
  const actionMatch = pageHtml.match(
    /processData:!0,cache:!0,data:\{\.\.\.e,nonce:window\.__x__nonce,action:"([^"]+)"/,
  );
  const resAction = actionMatch?.[1];
  if (!resAction) return undefined;

  // Step 4: Request link
  const linkRes = await axios.post<any>(
    `${BASE}/wp-admin/admin-ajax.php`,
    { ...decoded, action: resAction, nonce },
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: pageUrl,
      },
      timeout: 15_000,
    },
  );

  const linkData: string = linkRes.data?.data;
  if (!linkData) return undefined;

  // Step 5: Decode base64 lagi → parse HTML → ambil iframe src
  const iframeHtml = Buffer.from(linkData, 'base64').toString('utf8');
  const $i = cheerio.load(iframeHtml);
  const iframeSrc = $i('div > iframe').attr('src');
  if (!iframeSrc) return undefined;

  // Step 6: Resolve desustream/desudrive ke direct mp4/m3u8
  return resolveDesuStream(iframeSrc);
};

/** Resolve desustream/desudrive/pixeldrain ke direct video URL */
const resolveDesuStream = async (embedUrl: string): Promise<string | undefined> => {
  const html = await get(embedUrl);

  // desudrive patch ~19-dec-2024
  if (html.includes(`otakudesu('{\"file\":\"`)) {
    return html.split(`otakudesu('{\"file\":\"`)[1].split('"')[0];
  }
  // ondesu/updesu
  const ondesu = html.split("sources: [{'file':'")[1];
  if (ondesu) return ondesu.split("',")[0];
  // odstream
  if (html.includes('{id:"playerjs", file:"')) {
    return html.split('{id:"playerjs", file:"')[1].split('"')[0];
  }
  // source tag
  const $h = cheerio.load(html);
  const sourceSrc = $h('source').attr('src');
  if (sourceSrc) return sourceSrc;

  return undefined;
};

// ─── Cache anime-list ─────────────────────────────────────────────────────────

let animeListCache: Anime[] | null = null;

const getAnimeList = async (): Promise<Anime[]> => {
  if (animeListCache) return animeListCache;
  animeListCache = await scrapeAnimeList();
  return animeListCache;
};

// ─── Public API (sama persis interface-nya kayak api.ts) ──────────────────────

const fetchOngoing = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const data = await scrapeOngoing(page + 1);
  return { status: true, data };
};

const fetchPopular = async (_page = 0): Promise<ApiResponse<Anime[]>> => {
  // Otakudesu ga punya endpoint "popular" — pakai ongoing page 2 sebagai alternatif
  const data = await scrapeOngoing(2);
  return { status: true, data };
};

const fetchSchedule = async (): Promise<ApiResponse<ScheduleDay>> => {
  const data = await scrapeSchedule();
  return { status: true, data };
};

const fetchSearch = async (q: string, _page = 0): Promise<ApiResponse<Anime[]>> => {
  const data = await scrapeSearch(q);
  return { status: true, data };
};

const fetchDetail = async (id: string): Promise<ApiResponse<AnimeDetail>> => {
  const data = await scrapeDetail(id);
  if (!data) return { status: false, data: null as any };
  return { status: true, data };
};

const fetchEpisode = async (id: string) => {
  return scrapeEpisode(id);
};

const fetchAnimeList = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const all = await getAnimeList();
  const start = page * PAGE_SIZE;
  return { status: true, data: all.slice(start, start + PAGE_SIZE) };
};

const fetchAnimeListSearch = async (q: string): Promise<ApiResponse<Anime[]>> => {
  const all = await getAnimeList();
  const lower = q.toLowerCase();
  const found = all.filter(a => a.title.toLowerCase().includes(lower));
  return { status: true, data: found.slice(0, 48) };
};

const fetchGenre = async (): Promise<ApiResponse<Genre[]>> => ({ status: true, data: [] });
const fetchGenreFilter = async (_ids: string[], _page = 0): Promise<ApiResponse<Anime[]>> => ({ status: true, data: [] });

// ─── Export (drop-in pengganti api dari hooks/api.ts) ─────────────────────────

export const api = {
  home:         () => Promise.all([fetchSchedule(), fetchOngoing(), fetchPopular()]),
  detail:       (id: string) => fetchDetail(id),
  episode:      (id: string) => fetchEpisode(id),
  search:       (q: string, page = 0) => fetchSearch(q, page),
  searchLocal:  (q: string) => fetchAnimeListSearch(q),
  popular:      (page = 0) => fetchPopular(page),
  ongoing:      (page = 0) => fetchOngoing(page),
  schedule:     () => fetchSchedule(),
  genre:        () => fetchGenre(),
  genreFilter:  (ids: string[], page = 0) => fetchGenreFilter(ids, page),
  animeList:    (page = 0) => fetchAnimeList(page),
  animeListAll: () => getAnimeList(),
};

// ─── Re-export helpers (biar import dari scraper.ts bisa replace api.ts 1:1) ──

export const getAnimeSlug = (anime: Anime): string => {
  const encodedId = encodeURIComponent(anime.id).replace(/%/g, '_');
  const titleKebab = (anime.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${encodedId}---${titleKebab}`;
};

export const decodeAnimeId = (slug: string): string => {
  const encoded = slug.split('---')[0];
  try {
    return decodeURIComponent(encoded.replace(/_/g, '%'));
  } catch {
    return encoded;
  }
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '00:00';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

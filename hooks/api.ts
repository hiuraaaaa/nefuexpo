import { API_BASE, PROXY_BASE } from '@/constants';
import { ApiResponse, Anime, AnimeDetail, ScheduleDay, Genre } from '@/types';

const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`);
  return res.json();
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

// Untuk /latest dan /movies
// Response: [{ judul, cover, url, genre[], synopsis, sinopsis, status }]
function mapAnime(raw: any): Anime {
  return {
    id:           (raw.url || raw.judul || raw.anime_name || '').replace(/\/+$/, ''),
    title:        raw.judul ?? raw.anime_name ?? '',
    image_poster: raw.cover ?? '',
    image_cover:  raw.cover ?? '',
    synopsis:     raw.synopsis ?? raw.sinopsis ?? '',
    type:         raw.type ?? '',
    status:       raw.status ?? 'ONGOING',
    year:         raw.rilis ?? '',
    aired_start:  raw.rilis ?? '',
    studio:       raw.author ?? raw.studio ?? '',
    genre: Array.isArray(raw.genre)
      ? raw.genre.join(', ')
      : raw.genre ?? '',
    day:      raw.day ?? '',
    time:     raw.time ?? '',
    key_time: raw.key_time ?? '',
  };
}

// Untuk item dalam schedule animeList
// Response: [{ anime_name, cover, link }]
function mapScheduleItem(raw: any): Anime {
  return {
    id:           (raw.link || raw.anime_name || '').replace(/\/+$/, ''),
    title:        raw.anime_name ?? '',
    image_poster: raw.cover ?? '',
    image_cover:  raw.cover ?? '',
    synopsis:     '',
    type:         '',
    status:       'ONGOING',
    year:         '',
    aired_start:  '',
    studio:       '',
    genre:        '',
    day:          '',
    time:         '',
    key_time:     '',
  };
}

function mapAnimeDetail(raw: any): AnimeDetail {
  const base = mapAnime(raw);
  const chapters: any[] = [...(raw.chapter ?? [])].reverse();
  const episode_list = chapters.map((ch: any) => ({
    id:    `${ch.url}|${raw.series_id}|${ch.ch}`,
    index: Number(ch.ch),
    title: `Episode ${ch.ch}`,
  }));
  return { ...base, episode_list };
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

// GET /latest?page=1
// Response: array of { judul, cover, url, genre[], synopsis }
const fetchOngoing = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await get<any>(`/latest?page=${page + 1}`);
  const list = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

// GET /movies
// Response: array of { judul, cover, url, genre[], synopsis }
const fetchPopular = async (_page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await get<any>('/movies');
  const list = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

// GET /schedule
// Response: { data: [{ day, animeList: [{ anime_name, cover, link }] }] }
const fetchSchedule = async (): Promise<ApiResponse<ScheduleDay>> => {
  const json = await get<any>('/schedule');
  const raw = json?.data ?? (Array.isArray(json) ? json : []);
  const days: ScheduleDay = {};
  for (const item of raw) {
    const key = (item.day ?? '').toUpperCase(); // "SENIN", "SELASA", dst
    days[key] = (item.animeList ?? []).map(mapScheduleItem);
  }
  return { status: true, data: days };
};

// GET /search?q=&page=1
const fetchSearch = async (q: string, page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await get<any>(`/search?q=${encodeURIComponent(q)}&page=${page + 1}`);
  const result = Array.isArray(json) ? json : (json?.data?.result ?? json?.data ?? []);
  return { status: true, data: result.map(mapAnime) };
};

// GET /series?slug=
const fetchDetail = async (id: string): Promise<ApiResponse<AnimeDetail>> => {
  const json = await get<any>(`/series?slug=${encodeURIComponent(id)}`);
  if (!json?.data) return { status: false, data: null as any };
  return { status: true, data: mapAnimeDetail(json.data) };
};

// GET /stream
const fetchEpisode = async (combinedId: string): Promise<any> => {
  const [chUrl, slug, episode] = combinedId.split('|');
  const json = await get<any>(
    `/stream?post_id=${encodeURIComponent(chUrl)}&slug=${encodeURIComponent(slug)}&episode=${encodeURIComponent(episode)}`
  );
  const data = json?.data ?? {};
  const server: any[] = [];
  let i = 0;
  for (const quality of ['1080p', '720p', '480p', '360p']) {
    const links: any[] = data[quality] ?? [];
    for (const item of links) {
      if (item.link) {
        server.push({
          id:      String(i++),
          quality,
          link:    item.link,
          type:    'direct',
          provide: item.provide,
        });
      }
    }
  }
  return { status: true, data: { server } };
};

const fetchGenre = async (): Promise<ApiResponse<Genre[]>> => ({ status: true, data: [] });
const fetchGenreFilter = async (_ids: string[], _page = 0): Promise<ApiResponse<Anime[]>> => ({ status: true, data: [] });

// ─── Public API ────────────────────────────────────────────────────────────────

export const api = {
  home: () => Promise.all([fetchSchedule(), fetchOngoing(), fetchPopular()]),
  detail:      (id: string)              => fetchDetail(id),
  episode:     (id: string)              => fetchEpisode(id),
  search:      (q: string, page = 0)     => fetchSearch(q, page),
  popular:     (page = 0)                => fetchPopular(page),
  ongoing:     (page = 0)                => fetchOngoing(page),
  schedule:    ()                        => fetchSchedule(),
  genre:       ()                        => fetchGenre(),
  genreFilter: (ids: string[], page = 0) => fetchGenreFilter(ids, page),
};

export const getProxyUrl = (url: string) => `${PROXY_BASE}${url}`;

// ─── Slug encode/decode pakai btoa/atob (React Native safe, tanpa Buffer) ─────

export const getAnimeSlug = (anime: Anime): string => {
  try {
    const encodedId = btoa(unescape(encodeURIComponent(anime.id))).replace(/=/g, '');
    const titleKebab = (anime.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${encodedId}--${titleKebab}`;
  } catch {
    const titleKebab = (anime.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${anime.id}--${titleKebab}`;
  }
};

export const decodeAnimeId = (slug: string): string => {
  const encoded = slug.split('--')[0];
  try {
    return decodeURIComponent(escape(atob(encoded)));
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

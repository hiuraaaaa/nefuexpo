import { API_BASE, PROXY_BASE } from '@/constants';
import { ApiResponse, Anime, AnimeDetail, ScheduleDay, Genre } from '@/types';

const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`);
  return res.json();
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

// Untuk /latest, /movies, /search
// Response: [{ id, url, judul, cover, genre[], sinopsis, studio, score, status, rilis, total_episode }]
function mapAnime(raw: any): Anime {
  return {
    id:           (raw.url ?? String(raw.id ?? '')).replace(/\/+$/, ''),
    title:        raw.judul ?? raw.anime_name ?? '',
    image_poster: raw.cover ?? '',
    image_cover:  raw.cover ?? '',
    synopsis:     raw.sinopsis ?? raw.synopsis ?? '',
    type:         raw.type ?? '',
    status:       raw.status ?? 'ONGOING',
    year:         raw.rilis ?? raw.published?.split(' ').pop() ?? '',
    aired_start:  raw.published ?? raw.rilis ?? '',
    studio:       raw.studio ?? raw.author ?? '',
    genre: Array.isArray(raw.genre)
      ? raw.genre.join(', ')
      : raw.genre ?? '',
    day:      raw.day ?? '',
    time:     raw.time ?? '',
    key_time: raw.key_time ?? '',
  };
}

// Untuk item dalam schedule animeList
// Response: [{ anime_name, id, link, cover }]
function mapScheduleItem(raw: any): Anime {
  return {
    id:           (raw.link ?? raw.anime_name ?? '').replace(/\/+$/, ''),
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

// Untuk /detail?url=
// Response: { data: [{ series_id, judul, cover, sinopsis, published, author, rating, type, status, genre[], chapter[] }] }
function mapAnimeDetail(raw: any): AnimeDetail {
  const base: Anime = {
    id:           (raw.series_id ?? raw.url ?? '').replace(/\/+$/, ''),
    title:        raw.judul ?? '',
    image_poster: raw.cover ?? '',
    image_cover:  raw.cover ?? '',
    synopsis:     raw.sinopsis ?? '',
    type:         raw.type ?? '',
    status:       raw.status ?? '',
    year:         raw.published?.split(' ').pop() ?? '',
    aired_start:  raw.published ?? '',
    studio:       raw.author ?? '',
    genre: Array.isArray(raw.genre)
      ? raw.genre.join(', ')
      : raw.genre ?? '',
    day:      '',
    time:     '',
    key_time: '',
  };

  // chapter sudah desc (index 0 = episode terbaru), tidak perlu di-reverse
  const episode_list = (raw.chapter ?? []).map((ch: any) => ({
    id:    (ch.url ?? '').replace(/\/+$/, ''),
    index: ch.ch,   // e.g. "12 (End)", "11", "10"
    title: `Episode ${ch.ch}`,
  }));

  return { ...base, episode_list };
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

// GET /latest?page=1
// Response: array of anime objects
const fetchOngoing = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await get<any>(`/latest?page=${page + 1}`);
  const list = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

// GET /movies
// Response: array of anime objects
const fetchPopular = async (_page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await get<any>('/movies');
  const list = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

// GET /schedule
// Response: { data: [{ day: "Minggu"|"Senin"|..., animeList: [{ anime_name, id, link, cover }] }] }
// day pakai huruf kapital pertama → toUpperCase() supaya match DAY_KEYS
const fetchSchedule = async (): Promise<ApiResponse<ScheduleDay>> => {
  const json = await get<any>('/schedule');
  const raw: any[] = json?.data ?? (Array.isArray(json) ? json : []);
  const days: ScheduleDay = {};
  for (const item of raw) {
    const key = (item.day ?? '').toUpperCase(); // "Minggu" → "MINGGU"
    days[key] = (item.animeList ?? []).map(mapScheduleItem);
  }
  return { status: true, data: days };
};

// GET /search?q=&page=1
// Response: { data: [{ jumlah, result: [...], pagination: {} }] }
const fetchSearch = async (q: string, page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await get<any>(`/search?q=${encodeURIComponent(q)}&page=${page + 1}`);
  const result: any[] = json?.data?.[0]?.result ?? [];
  return { status: true, data: result.map(mapAnime) };
};

// GET /detail?url=
// Response: { data: [{ series_id, judul, cover, sinopsis, published, author, chapter[] }] }
const fetchDetail = async (id: string): Promise<ApiResponse<AnimeDetail>> => {
  const json = await get<any>(`/detail?url=${encodeURIComponent(id)}`);
  const raw = json?.data?.[0];
  if (!raw) return { status: false, data: null as any };
  return { status: true, data: mapAnimeDetail(raw) };
};

// GET /episode?url=&reso=720p
// Response: { data: [{ stream: [{ reso, link, provide, id }] }] }
// Prioritas: .mp4 dulu (direct play), fallback .m3u8 (HLS)
const fetchEpisode = async (id: string): Promise<any> => {
  const json = await get<any>(`/episode?url=${encodeURIComponent(id)}&reso=720p`);
  const streamData: any[] = json?.data?.[0]?.stream ?? [];

  // Prioritas: pixeldrain (paling reliable) → mp4 direct → m3u8
  const pixeldrain = streamData.filter((s: any) =>
    s.link && s.link.includes('pixeldrain.com')
  );
  const mp4s = streamData.filter((s: any) =>
    s.link && s.link.split('?')[0].endsWith('.mp4') && !s.link.includes('pixeldrain.com')
  );
  const m3u8s = streamData.filter((s: any) =>
    s.link && s.link.includes('.m3u8')
  );

  const combined = [...pixeldrain, ...mp4s, ...m3u8s];

  const server = combined.map((s: any, i: number) => ({
    id:      String(i),
    quality: s.reso ?? 'AUTO',
    link:    s.link,  // link mentah, tanpa proxy
    type:    s.link.includes('.m3u8') ? 'hls' : 'direct',
  }));

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

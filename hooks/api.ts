import { API_BASE } from '@/constants';
import { ApiResponse, Anime, AnimeDetail, ScheduleDay, Genre } from '@/types';

const PAGE_SIZE = 24;

const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`);
  return res.json();
};

// ─── Cache anime-list ─────────────────────────────────────────────────────────
let animeListCache: Anime[] | null = null;

const getAnimeList = async (): Promise<Anime[]> => {
  if (animeListCache) return animeListCache;
  const json = await get<Record<string, any[]>>('/anime-list');
  // Flatten semua huruf jadi satu array
  const all: Anime[] = Object.values(json).flat().map(mapAnime);
  animeListCache = all;
  return all;
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

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

  const episode_list = (raw.chapter ?? []).map((ch: any) => ({
    id:    (ch.url ?? '').replace(/\/+$/, ''),
    index: ch.ch,
    title: `Episode ${ch.ch}`,
  }));

  return { ...base, episode_list };
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

const fetchOngoing = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await get<any>(`/latest?page=${page + 1}`);
  const list = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

const fetchPopular = async (_page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await get<any>('/movies');
  const list = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

const fetchSchedule = async (): Promise<ApiResponse<ScheduleDay>> => {
  const json = await get<any>('/schedule');
  const raw: any[] = json?.data ?? (Array.isArray(json) ? json : []);
  const days: ScheduleDay = {};
  for (const item of raw) {
    const key = (item.day ?? '').toUpperCase();
    days[key] = (item.animeList ?? []).map(mapScheduleItem);
  }
  return { status: true, data: days };
};

const fetchSearch = async (q: string, page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await get<any>(`/search?q=${encodeURIComponent(q)}&page=${page + 1}`);
  const result: any[] = json?.data?.[0]?.result ?? [];
  return { status: true, data: result.map(mapAnime) };
};

const fetchDetail = async (id: string): Promise<ApiResponse<AnimeDetail>> => {
  const slugWithSlash = id.replace(/\/+$/, '') + '/';
  let json = await get<any>(`/detail?url=${encodeURIComponent(slugWithSlash)}`);
  let raw = json?.data?.[0];

  if (!raw || !raw.judul) {
    json = await get<any>(`/detail?url=${encodeURIComponent(id)}`);
    raw = json?.data?.[0];
  }

  if (!raw || !raw.judul) return { status: false, data: null as any };
  return { status: true, data: mapAnimeDetail(raw) };
};

const fetchEpisode = async (id: string): Promise<any> => {
  const slugWithSlash = id.replace(/\/+$/, '') + '/';
  let json = await get<any>(`/episode?url=${encodeURIComponent(slugWithSlash)}&reso=720p`);
  let streamData: any[] = json?.data?.[0]?.stream ?? [];

  if (streamData.length === 0) {
    json = await get<any>(`/episode?url=${encodeURIComponent(id)}&reso=720p`);
    streamData = json?.data?.[0]?.stream ?? [];
  }

  const mp4s        = streamData.filter((s: any) => s.link && s.link.split('?')[0].endsWith('.mp4') && !s.link.includes('pixeldrain.com'));
  const pixeldrain  = streamData.filter((s: any) => s.link && s.link.includes('pixeldrain.com') && !s.link.includes('?download'));
  const m3u8s       = streamData.filter((s: any) => s.link && s.link.includes('.m3u8'));
  const combined    = [...mp4s, ...pixeldrain, ...m3u8s];

  const server = combined.map((s: any, i: number) => ({
    id:      String(i),
    quality: s.reso ?? 'AUTO',
    link:    s.link,
    type:    s.link.includes('.m3u8') ? 'hls' : 'direct',
  }));

  return { status: true, data: { server } };
};

// ─── Anime List (untuk explore) ───────────────────────────────────────────────

const fetchAnimeList = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const all = await getAnimeList();
  const start = page * PAGE_SIZE;
  const slice = all.slice(start, start + PAGE_SIZE);
  return { status: true, data: slice };
};

const fetchAnimeListSearch = async (q: string): Promise<ApiResponse<Anime[]>> => {
  // Search lokal dari anime-list — cocok buat nama yg ga ada di /search
  const all = await getAnimeList();
  const lower = q.toLowerCase();
  const found = all.filter(a => a.title.toLowerCase().includes(lower));
  return { status: true, data: found.slice(0, 48) };
};

const fetchGenre = async (): Promise<ApiResponse<Genre[]>> => ({ status: true, data: [] });
const fetchGenreFilter = async (_ids: string[], _page = 0): Promise<ApiResponse<Anime[]>> => ({ status: true, data: [] });

// ─── Public API ───────────────────────────────────────────────────────────────

export const api = {
  home:          ()                          => Promise.all([fetchSchedule(), fetchOngoing(), fetchPopular()]),
  detail:        (id: string)                => fetchDetail(id),
  episode:       (id: string)                => fetchEpisode(id),
  search:        (q: string, page = 0)       => fetchSearch(q, page),
  searchLocal:   (q: string)                 => fetchAnimeListSearch(q),
  popular:       (page = 0)                  => fetchPopular(page),
  ongoing:       (page = 0)                  => fetchOngoing(page),
  schedule:      ()                          => fetchSchedule(),
  genre:         ()                          => fetchGenre(),
  genreFilter:   (ids: string[], page = 0)   => fetchGenreFilter(ids, page),
  // Explore
  animeList:     (page = 0)                  => fetchAnimeList(page),
  animeListAll:  ()                          => getAnimeList(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

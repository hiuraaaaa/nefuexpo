import { ApiResponse, Anime, AnimeDetail, ScheduleDay, Genre } from '@/types';
import crypto from 'expo-crypto';

// ─── Config ───────────────────────────────────────────────────────────────────

const API = 'https://apps.animekita.org/api/v1.2.5';
const PAGE_SIZE = 24;

const HEADERS = (isFlutter = false, isPost = false) => ({
  'accept':                    'application/json',
//  'accept-encoding':           'gzip',
  'host':                      'apps.animekita.org',
  'access-control-allow-origin': '*',
  'user-agent':                isFlutter ? 'Flutter/2.5.3' : 'Dart/3.9 (dart:io)',
  ...(isPost ? { 'content-type': 'text/plain; charset=utf-8' } : {}),
});

// ─── Session token (guest login) ──────────────────────────────────────────────

let _token: string | null = null;

const getToken = async (): Promise<string> => {
  if (_token) return _token;
  const uid = Array.from(crypto.getRandomBytes(5))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const payload = {
    user:    `Guest_${uid}`,
    email:   `gienetic_${uid}@gmail.com`,
    profil:  'https://lh3.googleusercontent.com/a/default',
  };
  const res = await fetch(`${API}/model/login.php`, {
    method:  'POST',
    headers: HEADERS(false, true),
    body:    JSON.stringify(payload),
  });
  const json = await res.json();
  _token = json?.data?.[0]?.token ?? '';
  return _token!;
};

/** Panggil sekali saat app start biar token udah ready */
export const initSession = async (): Promise<void> => { await getToken(); };

// ─── HTTP helpers (safe — gak throw, return null kalau gagal) ─────────────────

const safeGet = async <T>(path: string, params?: Record<string, any>): Promise<T | null> => {
  try {
    const url = new URL(`${API}${path}`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const res = await fetch(url.toString(), { headers: HEADERS() });
    const text = await res.text();
    if (!text || !text.trim().startsWith('{') && !text.trim().startsWith('[')) {
      console.warn(`[API] safeGet non-JSON response: ${path} →`, text.substring(0, 100));
      return null;
    }
    return JSON.parse(text);
  } catch (e: any) {
    console.warn(`[API] safeGet failed: ${path} —`, e?.message);
    return null;
  }
};

const safePost = async <T>(path: string, body: object | string, flutter = false): Promise<T | null> => {
  try {
    const res = await fetch(`${API}${path}`, {
      method:  'POST',
      headers: HEADERS(flutter, true),
      body:    typeof body === 'string' ? body : JSON.stringify(body),
    });
    const text = await res.text();
    if (!text || !text.trim().startsWith('{') && !text.trim().startsWith('[')) {
      console.warn(`[API] safePost non-JSON response: ${path} →`, text.substring(0, 100));
      return null;
    }
    return JSON.parse(text);
  } catch (e: any) {
    console.warn(`[API] safePost failed: ${path} —`, e?.message);
    return null;
  }
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapAnime(raw: any): Anime {
  const slug = (raw.url ?? raw.link ?? '').replace(/\/+$/, '');
  const id = slug || String(raw.id ?? '');
  return {
    id,
    title:        raw.judul ?? raw.anime_name ?? raw.title ?? '',
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
    key_time: (raw.day ?? '').toUpperCase(),
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
    index: parseInt(ch.ch) || 0,
    title: `Episode ${ch.ch}`,
  }));

  return { ...base, episode_list };
}

function mapSchedule(raw: any[]): ScheduleDay {
  const days: ScheduleDay = {};
  for (const item of raw) {
    const key = (item.day ?? '').toUpperCase();
    days[key] = (item.animeList ?? []).map((a: any) => ({
      id:           (a.link ?? a.url ?? '').replace(/\/+$/, ''),
      title:        a.anime_name ?? a.judul ?? '',
      image_poster: a.cover ?? '',
      image_cover:  a.cover ?? '',
      synopsis:     '',
      type:         '',
      status:       'ONGOING',
      year:         '',
      aired_start:  '',
      studio:       '',
      genre:        '',
      day:          item.day ?? '',
      time:         a.time ?? '',
      key_time:     (item.day ?? '').toUpperCase(),
    }));
  }
  return days;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

const fetchOngoing = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/baruupload.php', { page: page + 1 });
  const list: any[] = Array.isArray(json) ? json : (json?.data ?? []);
  console.log('[ONGOING] sample item:', JSON.stringify(list[0])); // ←
  return { status: true, data: list.map(mapAnime) };
};

const fetchComplete = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/home/ongoing.php', { page: page + 1, type: 'all' });
  const list: any[] = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

const fetchMovie = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/movie.php', { page: page + 1 });
  const list: any[] = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

const fetchRekomendasi = async (): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/rekomendasi.php');
  const list: any[] = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

const fetchSchedule = async (): Promise<ApiResponse<ScheduleDay>> => {
  const json = await safePost<any>('/jadwal.php', '');
  const raw: any[] = json?.data ?? (Array.isArray(json) ? json : []);
  return { status: true, data: mapSchedule(raw) };
};

const fetchSearch = async (q: string, page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/search.php', { keyword: q, page: page + 1, per_page: 20 });
  const result: any[] = json?.data?.[0]?.result ?? [];
  return { status: true, data: result.map(mapAnime) };
};

const fetchDetail = async (id: string): Promise<ApiResponse<AnimeDetail>> => {
  const token = await getToken();
  const slug  = id.replace(/\/+$/, '');
  const payload = { get: 'top', post_type: '1', post_id: slug, token };
  const json = await safePost<any>(`/series.php?url=${slug}`, payload);
  const raw = json?.data?.[0];
  if (!raw?.judul) return { status: false, data: null as any };
  return { status: true, data: mapAnimeDetail(raw) };
};

const fetchEpisode = async (id: string): Promise<any> => {
  const token  = await getToken();
  const epId   = id.replace(/\/+$/, '');
  const seriesSlug = epId.split('/').filter(Boolean).pop() ?? epId;
  const epNum = (epId.match(/episode-(\d+)/) ?? [])[1] ?? '1';
  const payload = {
    post_type:  '2',
    post_id:    epId,
    series_id:  seriesSlug,
    series_url: seriesSlug,
    episode:    epNum,
    token,
  };
  const json = await safePost<any>(`/series/episode/data.php?url=${epId}`, payload, true);
  const streamData: any[] = json?.data?.[0]?.streams ?? [];

  const mp4s       = streamData.filter(s => s.link && s.link.split('?')[0].endsWith('.mp4') && !s.link.includes('pixeldrain.com'));
  const pixeldrain = streamData.filter(s => s.link && s.link.includes('pixeldrain.com') && !s.link.includes('?download'));
  const m3u8s      = streamData.filter(s => s.link && s.link.includes('.m3u8'));
  const combined   = [...mp4s, ...pixeldrain, ...m3u8s];

  const server = combined.map((s: any, i: number) => ({
    id:      String(i),
    quality: s.reso ?? s.quality ?? 'AUTO',
    link:    s.link,
    type:    s.link.includes('.m3u8') ? 'hls' : 'direct',
  }));

  return { status: true, data: { server } };
};

// ─── Anime List (untuk explore) ───────────────────────────────────────────────

let animeListCache: Anime[] | null = null;

const getAnimeList = async (): Promise<Anime[]> => {
  if (animeListCache) return animeListCache;
  const results = await Promise.allSettled([
    fetchOngoing(0),
    fetchComplete(0),
  ]);
  const [ong, comp] = results.map(r =>
    r.status === 'fulfilled' ? r.value : { status: false, data: [] as Anime[] }
  );
  const merged = [...ong.data, ...comp.data];
  const seen = new Set<string>();
  animeListCache = merged.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
  return animeListCache;
};

const fetchAnimeList = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const all   = await getAnimeList();
  const start = page * PAGE_SIZE;
  return { status: true, data: all.slice(start, start + PAGE_SIZE) };
};

const fetchAnimeListSearch = async (q: string): Promise<ApiResponse<Anime[]>> => {
  const all   = await getAnimeList();
  const lower = q.toLowerCase();
  return { status: true, data: all.filter(a => a.title.toLowerCase().includes(lower)).slice(0, 48) };
};

const fetchGenre = async (): Promise<ApiResponse<Genre[]>> => ({ status: true, data: [] });
const fetchGenreFilter = async (_ids: string[], _page = 0): Promise<ApiResponse<Anime[]>> => ({ status: true, data: [] });

// ─── Public API ───────────────────────────────────────────────────────────────

const EMPTY_LIST: ApiResponse<Anime[]>    = { status: false, data: [] };
const EMPTY_SCHED: ApiResponse<ScheduleDay> = { status: false, data: {} };

export const api = {
  // Home — parallel fetch, kalau salah satu gagal sisanya tetap jalan
  home: async (): Promise<[ApiResponse<Anime[]>, ApiResponse<Anime[]>, ApiResponse<Anime[]>, ApiResponse<Anime[]>, ApiResponse<ScheduleDay>]> => {
    const results = await Promise.allSettled([
      fetchRekomendasi(),   // [0] hero carousel
      fetchOngoing(),       // [1] terbaru
      fetchComplete(),      // [2] complete
      fetchMovie(),         // [3] movies
      fetchSchedule(),      // [4] jadwal
    ]);

    const [rekom, ong, comp, mov, sched] = results;

    return [
      rekom.status === 'fulfilled' ? rekom.value : EMPTY_LIST,
      ong.status   === 'fulfilled' ? ong.value   : EMPTY_LIST,
      comp.status  === 'fulfilled' ? comp.value  : EMPTY_LIST,
      mov.status   === 'fulfilled' ? mov.value   : EMPTY_LIST,
      sched.status === 'fulfilled' ? sched.value : EMPTY_SCHED,
    ];
  },
  detail:       (id: string)               => fetchDetail(id),
  episode:      (id: string)               => fetchEpisode(id),
  search:       (q: string, page = 0)      => fetchSearch(q, page),
  searchLocal:  (q: string)                => fetchAnimeListSearch(q),
  ongoing:      (page = 0)                 => fetchOngoing(page),
  complete:     (page = 0)                 => fetchComplete(page),
  movie:        (page = 0)                 => fetchMovie(page),
  schedule:     ()                         => fetchSchedule(),
  rekomendasi:  ()                         => fetchRekomendasi(),
  genre:        ()                         => fetchGenre(),
  genreFilter:  (ids: string[], page = 0)  => fetchGenreFilter(ids, page),
  animeList:    (page = 0)                 => fetchAnimeList(page),
  animeListAll: ()                         => getAnimeList(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const getAnimeSlug = (anime: Anime): string => {
  const encodedId  = encodeURIComponent(anime.id).replace(/%/g, '_');
  const titleKebab = (anime.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${encodedId}---${titleKebab}`;
};

export const decodeAnimeId = (slug: string): string => {
  const encoded = slug.split('---')[0];
  try { return decodeURIComponent(encoded.replace(/_/g, '%')); }
  catch { return encoded; }
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

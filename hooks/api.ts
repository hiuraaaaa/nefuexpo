import { ApiResponse, Anime, AnimeDetail, ScheduleDay, Genre } from '@/types';
import crypto from 'expo-crypto';

// ─── Config ───────────────────────────────────────────────────────────────────

const API = 'https://apps.animekita.org/api/v1.2.5';

const HEADERS = (isFlutter = false, isPost = false) => ({
  'accept':                      'application/json',
  'host':                        'apps.animekita.org',
  'access-control-allow-origin': '*',
  'user-agent': isFlutter ? 'Flutter/2.5.3' : 'Dart/3.9 (dart:io)',
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
    user:   `Guest_${uid}`,
    email:  `gienetic_${uid}@gmail.com`,
    profil: 'https://lh3.googleusercontent.com/a/default',
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

export const initSession = async (): Promise<void> => { await getToken(); };

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

const safeGet = async <T>(path: string, params?: Record<string, any>): Promise<T | null> => {
  try {
    const url = new URL(`${API}${path}`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const res  = await fetch(url.toString(), { headers: HEADERS() });
    const text = await res.text();
    const t    = text.trim();
    if (!t || (!t.startsWith('{') && !t.startsWith('['))) {
      console.warn(`[API] safeGet non-JSON: ${path} →`, t.substring(0, 80));
      return null;
    }
    return JSON.parse(t);
  } catch (e: any) {
    console.warn(`[API] safeGet failed: ${path} —`, e?.message);
    return null;
  }
};

const safePost = async <T>(path: string, body: object | string, flutter = false): Promise<T | null> => {
  try {
    const res  = await fetch(`${API}${path}`, {
      method:  'POST',
      headers: HEADERS(flutter, true),
      body:    typeof body === 'string' ? body : JSON.stringify(body),
    });
    const text = await res.text();
    const t    = text.trim();
    if (!t || (!t.startsWith('{') && !t.startsWith('['))) {
      console.warn(`[API] safePost non-JSON: ${path} →`, t.substring(0, 80));
      return null;
    }
    return JSON.parse(t);
  } catch (e: any) {
    console.warn(`[API] safePost failed: ${path} —`, e?.message);
    return null;
  }
};

// ─── Image URL normalizer ─────────────────────────────────────────────────────

function normalizeImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const wpMatch = trimmed.match(/https?:\/\/i\d\.wp\.com\/(.+)/);
  if (wpMatch) return 'https://' + wpMatch[1];
  return trimmed;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapAnime(raw: any): Anime {
  const cover = normalizeImageUrl(raw.cover ?? '');
  const slug  = (raw.url ?? raw.link ?? '').replace(/\/+$/, '');
  const id    = slug || String(raw.id ?? '');
  return {
    id,
    title:         raw.judul ?? raw.anime_name ?? raw.title ?? '',
    image_poster:  cover,
    image_cover:   cover,
    synopsis:      raw.sinopsis ?? raw.synopsis ?? '',
    type:          raw.type ?? '',
    status:        raw.status ?? 'ONGOING',
    year:          raw.rilis ?? raw.published?.split(' ').pop() ?? '',
    aired_start:   raw.published ?? raw.rilis ?? '',
    studio:        raw.studio ?? raw.author ?? '',
    genre: Array.isArray(raw.genre) ? raw.genre.join(', ') : raw.genre ?? '',
    day:           raw.day ?? '',
    time:          raw.time ?? '',
    key_time:      (raw.day ?? '').toUpperCase(),
    // field tambahan
    score:         raw.score ?? null,
    total_episode: raw.total_episode ?? null,
    last_chapter:  raw.lastch ?? null,
    last_update:   raw.lastup ?? null,
  };
}

function mapAnimeDetail(raw: any): AnimeDetail {
  const cover = normalizeImageUrl(raw.cover ?? '');
  const base: Anime = {
    id:            (raw.series_id ?? raw.url ?? '').replace(/\/+$/, ''),
    title:         raw.judul ?? '',
    image_poster:  cover,
    image_cover:   cover,
    synopsis:      raw.sinopsis ?? '',
    type:          raw.type ?? '',
    status:        raw.status ?? '',
    year:          raw.published?.split(' ').pop() ?? '',
    aired_start:   raw.published ?? '',
    studio:        raw.author ?? '',
    genre: Array.isArray(raw.genre) ? raw.genre.join(', ') : raw.genre ?? '',
    day: '', time: '', key_time: '',
    score:         raw.rating ?? null,   // di detail field-nya "rating", bukan "score"
    total_episode: raw.total_episode ?? null,
    last_chapter:  raw.lastch ?? null,
    last_update:   raw.lastup ?? null,
  };

  const episode_list = (raw.chapter ?? []).map((ch: any) => ({
    id:          (ch.url ?? '').replace(/\/+$/, ''),
    index:       parseInt(ch.ch) || 0,
    title:       `Episode ${ch.ch}`,
    // field tambahan
    chapter_id:  ch.id ?? null,
    date:        ch.date ?? '',
    views:       ch.views ?? 0,
    last_durasi: ch.lastDurasi ?? null,
    full_durasi: ch.fullDurasi ?? null,
  }));

  return {
    ...base,
    episode_list,
    rating:    raw.rating ?? null,
    countdown: raw.countdown ?? null,
    bookmark:  raw.bookmark ?? null,
    genreurl:  Array.isArray(raw.genreurl) ? raw.genreurl : [],
    history:   Array.isArray(raw.history)  ? raw.history  : [],
  };
}

function mapSchedule(raw: any[]): ScheduleDay {
  const days: ScheduleDay = {};
  for (const item of raw) {
    const key  = (item.day ?? '').toUpperCase();
    days[key]  = (item.animeList ?? []).map((a: any) => ({
      id:           (a.link ?? a.url ?? '').replace(/\/+$/, ''),
      title:        a.anime_name ?? a.judul ?? '',
      image_poster: normalizeImageUrl(a.cover ?? ''),
      image_cover:  normalizeImageUrl(a.cover ?? ''),
      synopsis: '', type: '', status: 'ONGOING',
      year: '', aired_start: '', studio: '', genre: '',
      day:      item.day ?? '',
      time:     a.time ?? '',
      key_time: (item.day ?? '').toUpperCase(),
    }));
  }
  return days;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

// [1] Rekomendasi — /rekomendasi.php
const fetchRekomendasi = async (): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/rekomendasi.php');
  const list: any[] = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

// [2] Ongoing — /home/ongoing.php
const fetchComplete = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/home/ongoing.php', { page: page + 1, type: 'all' });
  const list: any[] = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

// [3] Baru Upload — /baruupload.php
const fetchOngoing = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/baruupload.php', { page: page + 1 });
  const list: any[] = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

// [4] Movie — /movie.php
const fetchMovie = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/movie.php', { page: page + 1 });
  const list: any[] = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

// [5] Search — /search.php
const fetchSearch = async (q: string, page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/search.php', { keyword: q, page: page + 1, per_page: 20 });
  const result: any[] = json?.data?.[0]?.result ?? [];
  return { status: true, data: result.map(mapAnime) };
};

// [6] Detail Series — /series.php
const fetchDetail = async (id: string): Promise<ApiResponse<AnimeDetail>> => {
  const token   = await getToken();
  const slug    = id.replace(/\/+$/, '');
  const payload = { get: 'top', post_type: '1', post_id: slug, token };
  const json    = await safePost<any>(`/series.php?url=${slug}`, payload);
  const raw     = json?.data?.[0];
  if (!raw?.judul) return { status: false, data: null as any };
  return { status: true, data: mapAnimeDetail(raw) };
};

// [7] Episode Stream — /series/episode/data.php
// streams = object { "480p": [...], "720p": [...] }, bukan flat array
const fetchEpisode = async (id: string): Promise<any> => {
  const token      = await getToken();
  const epId       = id.replace(/\/+$/, '');
  const seriesSlug = epId.split('/').filter(Boolean).pop() ?? epId;
  const epNum      = (epId.match(/(?:episode-|-)(\d+)$/) ?? [])[1] ?? '1';

  const payload = {
    post_type:  '2',
    post_id:    epId,
    series_id:  seriesSlug,
    series_url: seriesSlug,
    episode:    epNum,
    token,
  };

  const json       = await safePost<any>(`/series/episode/data.php?url=${epId}`, payload, true);
  const raw        = json?.data?.[0];
  if (!raw) return { status: false, data: { server: [] } };

  // streams adalah object per kualitas, iterate tiap key
  const streamsObj: Record<string, any[]> = raw.streams ?? {};
  const resoSize:   Record<string, string> = raw.resoSize   ?? {};
  const resoSizeKb: Record<string, number> = raw.resoSizeKb ?? {};

  const server: any[] = [];

  for (const [quality, list] of Object.entries(streamsObj)) {
    for (const s of list) {
      const isPixeldrainDownload = s.link?.includes('pixeldrain.com') && s.link?.includes('?download');
      // Skip pixeldrain ?download — tidak bisa langsung diplay
      if (isPixeldrainDownload) continue;

      const isM3u8 = s.link?.includes('.m3u8');

      server.push({
        id:       String(s.id),
        quality,
        link:     s.link,
        type:     isM3u8 ? 'hls' : 'direct',
        provide:  s.provide ?? null,
        size_kb:  s.size_kb ?? resoSizeKb[quality] ?? null,
        size:     resoSize[quality] ?? null,
      });
    }
  }

  // Sort priority: mp4 direct > pixeldrain > m3u8
  server.sort((a, b) => {
    const rank = (link: string) =>
      link.includes('.m3u8')          ? 2 :
      link.includes('pixeldrain.com') ? 1 : 0;
    return rank(a.link) - rank(b.link);
  });

  return {
    status: true,
    data: {
      episode_id: raw.episode_id ?? null,
      reso:       raw.reso ?? [],
      server,
    },
  };
};

// [8] Jadwal — /jadwal.php
const fetchSchedule = async (): Promise<ApiResponse<ScheduleDay>> => {
  const json = await safePost<any>('/jadwal.php', '');
  const raw: any[] = json?.data ?? (Array.isArray(json) ? json : []);
  return { status: true, data: mapSchedule(raw) };
};

// ─── Explore helpers ──────────────────────────────────────────────────────────

const fetchAnimeList = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  return fetchOngoing(page);
};

const fetchAnimeListSearch = async (q: string): Promise<ApiResponse<Anime[]>> => {
  const res   = await fetchOngoing(0);
  const lower = q.toLowerCase();
  return {
    status: true,
    data:   res.data.filter(a => a.title.toLowerCase().includes(lower)),
  };
};

const fetchGenre = async (): Promise<ApiResponse<Genre[]>> => ({ status: true, data: [] });
const fetchGenreFilter = async (_ids: string[], _page = 0): Promise<ApiResponse<Anime[]>> => ({ status: true, data: [] });

// ─── Public API ───────────────────────────────────────────────────────────────

const EMPTY_LIST:  ApiResponse<Anime[]>     = { status: false, data: [] };
const EMPTY_SCHED: ApiResponse<ScheduleDay> = { status: false, data: {} };

export const api = {
  home: async (): Promise<[
    ApiResponse<Anime[]>,
    ApiResponse<Anime[]>,
    ApiResponse<Anime[]>,
    ApiResponse<Anime[]>,
    ApiResponse<ScheduleDay>
  ]> => {
    const results = await Promise.allSettled([
      fetchRekomendasi(),
      fetchOngoing(),
      fetchComplete(),
      fetchMovie(),
      fetchSchedule(),
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

  detail:      (id: string)              => fetchDetail(id),
  episode:     (id: string)              => fetchEpisode(id),
  search:      (q: string, page = 0)     => fetchSearch(q, page),
  searchLocal: (q: string)               => fetchAnimeListSearch(q),
  ongoing:     (page = 0)                => fetchOngoing(page),
  complete:    (page = 0)                => fetchComplete(page),
  movie:       (page = 0)                => fetchMovie(page),
  schedule:    ()                        => fetchSchedule(),
  rekomendasi: ()                        => fetchRekomendasi(),
  genre:       ()                        => fetchGenre(),
  genreFilter: (ids: string[], page = 0) => fetchGenreFilter(ids, page),
  animeList:   (page = 0)                => fetchAnimeList(page),
  animeListAll: ()                       => fetchOngoing(0),
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

import { ApiResponse, Anime, AnimeDetail, ScheduleDay, Genre } from '@/types';
import crypto from 'expo-crypto';

// ─── Config ───────────────────────────────────────────────────────────────────

const API = 'https://apps.animekita.org/api/v1.2.5';

const HEADERS = (isFlutter = false, isPost = false) => ({
  'accept':                      'application/json',
  'host':                        'apps.animekita.org',
  'access-control-allow-origin': '*',
  // Dart/Flutter user-agent biar diterima server
  'user-agent': isFlutter ? 'Flutter/2.5.3' : 'Dart/3.9 (dart:io)',
  // Content-type hanya untuk POST
  ...(isPost ? { 'content-type': 'text/plain; charset=utf-8' } : {}),
  // JANGAN tambah 'accept-encoding: gzip' — RN fetch gak auto-decompress
});

// ─── Session token (guest login) ──────────────────────────────────────────────
// Token diperlukan untuk endpoint detail & episode
// Di-cache in-memory selama app hidup

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

/** Panggil sekali saat app start biar token udah ready */
export const initSession = async (): Promise<void> => { await getToken(); };

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
// safeGet & safePost: gak throw — return null kalau response bukan JSON
// Ini penting karena server kadang return HTML error page atau response kosong

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
// Beberapa cover di-proxy lewat i0.wp.com (WordPress CDN)
// RN fetch gak bisa load karena butuh referer — strip proxy, akses langsung
// Juga .trim() untuk hapus whitespace/newline invisible dari response API

function normalizeImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  // https://i0.wp.com/cdn.myanimelist.net/... → https://cdn.myanimelist.net/...
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
    title:        raw.judul ?? raw.anime_name ?? raw.title ?? '',
    image_poster: cover,
    image_cover:  cover,
    synopsis:     raw.sinopsis ?? raw.synopsis ?? '',
    type:         raw.type ?? '',
    status:       raw.status ?? 'ONGOING',
    year:         raw.rilis ?? raw.published?.split(' ').pop() ?? '',
    aired_start:  raw.published ?? raw.rilis ?? '',
    studio:       raw.studio ?? raw.author ?? '',
    genre: Array.isArray(raw.genre) ? raw.genre.join(', ') : raw.genre ?? '',
    day:      raw.day ?? '',
    time:     raw.time ?? '',
    key_time: (raw.day ?? '').toUpperCase(),
  };
}

function mapAnimeDetail(raw: any): AnimeDetail {
  const cover = normalizeImageUrl(raw.cover ?? '');
  const base: Anime = {
    id:           (raw.series_id ?? raw.url ?? '').replace(/\/+$/, ''),
    title:        raw.judul ?? '',
    image_poster: cover,
    image_cover:  cover,
    synopsis:     raw.sinopsis ?? '',
    type:         raw.type ?? '',
    status:       raw.status ?? '',
    year:         raw.published?.split(' ').pop() ?? '',
    aired_start:  raw.published ?? '',
    studio:       raw.author ?? '',
    genre: Array.isArray(raw.genre) ? raw.genre.join(', ') : raw.genre ?? '',
    day: '', time: '', key_time: '',
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
// Dipakai: hero carousel di home
// Return: ~10 item, no pagination
const fetchRekomendasi = async (): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/rekomendasi.php');
  const list: any[] = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

// [2] Ongoing — /home/ongoing.php
// Dipakai: section "Complete" di home
// Return: 10 item per page, page 2+ kosong (total cuma ~10)
const fetchComplete = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/home/ongoing.php', { page: page + 1, type: 'all' });
  const list: any[] = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

// [3] Baru Upload — /baruupload.php
// Dipakai: section "Terbaru" di home + explore (load more per page)
// Return: 25 item per page, banyak page (tested sampai page 11+)
// INI endpoint utama untuk explore
const fetchOngoing = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/baruupload.php', { page: page + 1 });
  const list: any[] = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

// [4] Movie — /movie.php
// Dipakai: section "Movies" di home (rank card horizontal)
// Return: banyak item (tested 50+), support pagination
const fetchMovie = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/movie.php', { page: page + 1 });
  const list: any[] = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

// [5] Search — /search.php
// Dipakai: search bar di explore (remote search)
// Params: keyword, page, per_page
const fetchSearch = async (q: string, page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/search.php', { keyword: q, page: page + 1, per_page: 20 });
  const result: any[] = json?.data?.[0]?.result ?? [];
  return { status: true, data: result.map(mapAnime) };
};

// [6] Detail Series — /series.php
// Dipakai: halaman detail anime (info + episode list)
// Butuh token guest
const fetchDetail = async (id: string): Promise<ApiResponse<AnimeDetail>> => {
  const token   = await getToken();
  const slug    = id.replace(/\/+$/, '');
  const payload = { get: 'top', post_type: '1', post_id: slug, token };
  const json    = await safePost<any>(`/series.php?url=${slug}`, payload);
  const raw     = json?.data?.[0];
  if (!raw?.judul) return { status: false, data: null as any };
  return { status: true, data: mapAnimeDetail(raw) };
};

// [6] Ekstrak Stream — /series/episode/data.php
// Dipakai: halaman player/watch
// Return: list server (mp4 direct, pixeldrain, m3u8/HLS)
// Butuh token guest + flutter user-agent
const fetchEpisode = async (id: string): Promise<any> => {
  const token      = await getToken();
  const epId       = id.replace(/\/+$/, '');
  const seriesSlug = epId.split('/').filter(Boolean).pop() ?? epId;
  const epNum      = (epId.match(/episode-(\d+)/) ?? [])[1] ?? '1';
  const payload    = {
    post_type:  '2',
    post_id:    epId,
    series_id:  seriesSlug,
    series_url: seriesSlug,
    episode:    epNum,
    token,
  };
  const json       = await safePost<any>(`/series/episode/data.php?url=${epId}`, payload, true);
  const streamData: any[] = json?.data?.[0]?.streams ?? [];

  // Priority: mp4 direct > pixeldrain > m3u8/HLS
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

// [7] Jadwal — /jadwal.php
// Dipakai: tab jadwal + section "Hari X" di home
// Return: per hari (SENIN-MINGGU), tiap hari ada list anime + jam tayang
const fetchSchedule = async (): Promise<ApiResponse<ScheduleDay>> => {
  const json = await safePost<any>('/jadwal.php', '');
  const raw: any[] = json?.data ?? (Array.isArray(json) ? json : []);
  return { status: true, data: mapSchedule(raw) };
};

// ─── Explore: Anime List ──────────────────────────────────────────────────────
// Pakai fetchOngoing (baruupload.php) — 25 item/page, banyak page
// Tiap panggil api.animeList(page) fetch 1 page baru langsung dari API
// Search local filter dari page 0 saja (cukup untuk keyword match)

const fetchAnimeList = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  // Langsung fetch per page — gak perlu cache karena explore udah ada load more
  return fetchOngoing(page);
};

const fetchAnimeListSearch = async (q: string): Promise<ApiResponse<Anime[]>> => {
  // Search local dari page 0 (25 item)
  // Kalau mau hasil lebih banyak, ganti ke fetchSearch (remote) di explore.tsx
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
  // Home — fetch semua section parallel, kalau 1 gagal sisanya tetap jalan
  home: async (): Promise<[
    ApiResponse<Anime[]>,    // [0] rekomendasi  → hero carousel
    ApiResponse<Anime[]>,    // [1] ongoing      → section Terbaru
    ApiResponse<Anime[]>,    // [2] complete     → section Complete
    ApiResponse<Anime[]>,    // [3] movie        → section Movies
    ApiResponse<ScheduleDay> // [4] jadwal       → section Hari X
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

  detail:      (id: string)              => fetchDetail(id),         // detail anime + episode list
  episode:     (id: string)              => fetchEpisode(id),        // stream links
  search:      (q: string, page = 0)     => fetchSearch(q, page),    // remote search
  searchLocal: (q: string)               => fetchAnimeListSearch(q), // local filter dari baruupload
  ongoing:     (page = 0)                => fetchOngoing(page),      // baruupload per page
  complete:    (page = 0)                => fetchComplete(page),     // ongoing.php (10 item)
  movie:       (page = 0)                => fetchMovie(page),        // movie per page
  schedule:    ()                        => fetchSchedule(),         // jadwal mingguan
  rekomendasi: ()                        => fetchRekomendasi(),      // rekomendasi
  genre:       ()                        => fetchGenre(),            // kosong (belum ada endpoint)
  genreFilter: (ids: string[], page = 0) => fetchGenreFilter(ids, page), // kosong
  animeList:   (page = 0)                => fetchAnimeList(page),    // explore: baruupload per page
  animeListAll: ()                       => fetchOngoing(0),         // compat, return page 0
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Encode anime id jadi URL-safe slug untuk routing
export const getAnimeSlug = (anime: Anime): string => {
  const encodedId  = encodeURIComponent(anime.id).replace(/%/g, '_');
  const titleKebab = (anime.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${encodedId}---${titleKebab}`;
};

// Decode slug balik ke id asli
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

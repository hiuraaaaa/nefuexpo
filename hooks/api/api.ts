import { ApiResponse, Anime, AnimeDetail, ScheduleDay, Genre } from '@/types';

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
let _tokenInflight: Promise<string> | null = null;

const getToken = async (): Promise<string> => {
  if (_token) return _token;
  // deduplicate concurrent calls — hanya 1 login request yang jalan
  if (_tokenInflight) return _tokenInflight;

  _tokenInflight = (async () => {
    try {
      const uid     = Math.random().toString(36).substring(2, 7);
      const payload = {
        user:   `Guest_${uid}`,
        email:  `gienetic_${uid}@gmail.com`,
        profil: 'https://lh3.googleusercontent.com/a/default',
      };
      const res  = await fetchWithTimeout(`${API}/model/login.php`, {
        method:  'POST',
        headers: HEADERS(false, true),
        body:    JSON.stringify(payload),
      }, 10_000);
      const json = await res.json();
      _token = json?.data?.[0]?.token ?? '';
      return _token!;
    } finally {
      _tokenInflight = null;
    }
  })();

  return _tokenInflight;
};

export const initSession = async (): Promise<void> => { await getToken(); };

/** Reset token — dipanggil kalau dapat 401 dari server */
export const resetToken = (): void => { _token = null; };

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

const fetchWithTimeout = (url: RequestInfo, init: RequestInit, ms = 15_000): Promise<Response> => {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
};

const safeGet = async <T>(path: string, params?: Record<string, string | number>): Promise<T | null> => {
  try {
    const url = new URL(`${API}${path}`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const res  = await fetchWithTimeout(url.toString(), { headers: HEADERS() });
    if (!res.ok) {
      console.warn(`[API] safeGet HTTP ${res.status}: ${path}`);
      return null;
    }
    const text = await res.text();
    const t    = text.trim();
    if (!t || (!t.startsWith('{') && !t.startsWith('['))) {
      console.warn(`[API] safeGet non-JSON: ${path} →`, t.substring(0, 80));
      return null;
    }
    return JSON.parse(t);
  } catch (e: any) {
    if (e?.name !== 'AbortError') console.warn(`[API] safeGet failed: ${path} —`, e?.message);
    return null;
  }
};

const safePost = async <T>(path: string, body: object | string, flutter = false): Promise<T | null> => {
  try {
    const res  = await fetchWithTimeout(`${API}${path}`, {
      method:  'POST',
      headers: HEADERS(flutter, true),
      body:    typeof body === 'string' ? body : JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`[API] safePost HTTP ${res.status}: ${path}`);
      return null;
    }
    const text = await res.text();
    const t    = text.trim();
    if (!t || (!t.startsWith('{') && !t.startsWith('['))) {
      console.warn(`[API] safePost non-JSON: ${path} →`, t.substring(0, 80));
      return null;
    }
    return JSON.parse(t);
  } catch (e: any) {
    if (e?.name !== 'AbortError') console.warn(`[API] safePost failed: ${path} —`, e?.message);
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
    score:         raw.rating ?? null,
    total_episode: raw.total_episode ?? null,
    last_chapter:  raw.lastch ?? null,
    last_update:   raw.lastup ?? null,
  };

  const episode_list = (raw.chapter ?? []).map((ch: any) => ({
    id:          (ch.url ?? '').replace(/\/+$/, ''),
    index:       parseInt(ch.ch) || 0,
    title:       `Episode ${ch.ch}`,
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
      date:     item.date ?? '',
      date_ts:  item.date_ts ?? null,
      updated:  a.updated ?? null,
      time:     a.time ?? '',
      key_time: (item.day ?? '').toUpperCase(),
    }));
  }
  return days;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

const fetchRekomendasi = async (): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/rekomendasi.php');
  const list: any[] = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

const fetchComplete = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/home/ongoing.php', { page: page + 1, type: 'all' });
  const list: any[] = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

const fetchOngoing = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/baruupload.php', { page: page + 1 });
  const list: any[] = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

const fetchMovie = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/movie.php', { page: page + 1 });
  const list: any[] = Array.isArray(json) ? json : (json?.data ?? []);
  return { status: true, data: list.map(mapAnime) };
};

const fetchSearch = async (q: string, page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await safeGet<any>('/search.php', { keyword: q, page: page + 1, per_page: 20 });
  // Response bisa: array langsung, atau { data: [...] }, atau { data: [{ result: [...] }] }
  const result: any[] =
    Array.isArray(json)              ? json :
    Array.isArray(json?.data)        ? json.data :
    json?.data?.[0]?.result          ?? [];
  return { status: true, data: result.map(mapAnime) };
};

const fetchDetail = async (id: string): Promise<ApiResponse<AnimeDetail>> => {
  const token = await getToken();
  const slug  = id.replace(/\/+$/, '');

  const tryFetch = async (s: string) => {
    const payload = { get: 'top', post_type: '1', post_id: s, token };
    const json    = await safePost<any>(`/series.php?url=${s}`, payload);
    return json?.data?.[0];
  };

  let raw = await tryFetch(slug);
  if (!raw?.series_id) raw = await tryFetch(slug + '/');

  if (!raw?.judul) return { status: false, data: null as any };
  return { status: true, data: mapAnimeDetail(raw) };
};

const fetchEpisode = async (id: string): Promise<any> => {
  const token = await getToken();

  const tryFetch = async (epId: string) => {
    const parts      = epId.split('/').filter(Boolean);
    const seriesSlug = parts.length > 1
      ? parts[0]
      : (epId.split('-episode-')[0] ?? epId);
    const epNum = (
      epId.match(/\/episode-(\d+)/) ??
      epId.match(/-episode-(\d+)/) ??
      epId.match(/-(\d+)$/) ??
      []
    )[1] ?? '1';
    const payload = {
      post_type:  '2',
      post_id:    epId,
      series_id:  seriesSlug,
      series_url: seriesSlug,
      episode:    epNum,
      token,
    };
    const json = await safePost<any>(`/series/episode/data.php?url=${epId}`, payload, true);
    return json?.data?.[0];
  };

  const slug = id.replace(/\/+$/, '');
  let raw = await tryFetch(slug);
  if (!raw?.episode_id) raw = await tryFetch(slug + '/');

  if (!raw) return { status: false, data: { server: [] } };

  const streamsObj: Record<string, any[]>   = raw.streams    ?? {};
  const resoSize:   Record<string, string>  = raw.resoSize   ?? {};
  const resoSizeKb: Record<string, number>  = raw.resoSizeKb ?? {};

  const server: any[] = [];

  for (const [quality, list] of Object.entries(streamsObj)) {
    for (const s of list) {
      const isPixeldrainDownload = s.link?.includes('pixeldrain.com') && s.link?.includes('?download');
      if (isPixeldrainDownload) continue;
      const isM3u8 = s.link?.includes('.m3u8');
      server.push({
        id:      String(s.id),
        quality,
        link:    s.link,
        type:    isM3u8 ? 'hls' : 'direct',
        provide: s.provide ?? null,
        size_kb: s.size_kb ?? resoSizeKb[quality] ?? null,
        size:    resoSize[quality] ?? null,
      });
    }
  }

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

const fetchSchedule = async (): Promise<ApiResponse<ScheduleDay>> => {
  const json = await safePost<any>('/jadwal.php', '');
  const raw: any[] = json?.data ?? (Array.isArray(json) ? json : []);
  return { status: true, data: mapSchedule(raw) };
};

// ─── Explore helpers ──────────────────────────────────────────────────────────

const fetchAnimeList = async (page = 0): Promise<ApiResponse<Anime[]>> => fetchOngoing(page);

const fetchAnimeListSearch = async (q: string): Promise<ApiResponse<Anime[]>> => {
  const res   = await fetchOngoing(0);
  const lower = q.toLowerCase();
  return { status: true, data: res.data.filter(a => a.title.toLowerCase().includes(lower)) };
};

const fetchGenre       = async (): Promise<ApiResponse<Genre[]>>              => ({ status: true, data: [] });
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
  if (!isFinite(seconds) || isNaN(seconds)) return '00:00';
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
};

// ─── Schedule Helpers ─────────────────────────────────────────────────────────

export const formatScheduleDate = (date_ts: number): string =>
  new Date(date_ts * 1000).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

export const formatScheduleTime = (date_ts: number): string =>
  new Date(date_ts * 1000).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit',
  });

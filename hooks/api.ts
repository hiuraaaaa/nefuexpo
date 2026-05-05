import { API_BASE, PROXY_BASE } from '@/constants';
import { ApiResponse, Anime, AnimeDetail, ScheduleDay, Genre } from '@/types';

// ─── Helper GET ────────────────────────────────────────────────────────────────
const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`);
  const json = await res.json();
  return json;
};

// ─── Ongoing ──────────────────────────────────────────────────────────────────
// Old: GET /ongoing?page=0  (0-based)
// New: GET /ongoing?page=1  (1-based)
const fetchOngoing = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await get<any>(`/ongoing?page=${page + 1}`);
  const items: Anime[] = (json?.data ?? []).map(mapAnime);
  return { status: json?.status === 'ok', data: items };
};

// ─── Popular / Rekomendasi ────────────────────────────────────────────────────
// Old: GET /popular?page=0
// New: GET /rekomendasi  (no pagination, returns flat array)
const fetchPopular = async (_page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await get<any>('/rekomendasi');
  const items: Anime[] = (json?.data ?? []).map(mapAnime);
  return { status: json?.status === 'ok', data: items };
};

// ─── Schedule ─────────────────────────────────────────────────────────────────
// Old: GET /schedule → { data: { SENIN: [...], SELASA: [...], ... } }
// New: GET /jadwal   → { data: [ { hari: "SENIN", list: [...] }, ... ] }
const fetchSchedule = async (): Promise<ApiResponse<ScheduleDay>> => {
  const json = await get<any>('/jadwal');
  const days: ScheduleDay = {};
  for (const item of json?.data ?? []) {
    const key: string = (item.hari ?? '').toUpperCase();
    days[key] = (item.list ?? []).map(mapAnime);
  }
  return { status: json?.status === 'ok', data: days };
};

// ─── Search ───────────────────────────────────────────────────────────────────
// Old: GET /search?q=&page=0  (0-based)
// New: GET /search?q=&page=1  (1-based)
const fetchSearch = async (q: string, page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await get<any>(`/search?q=${encodeURIComponent(q)}&page=${page + 1}`);
  // new API: { data: { data: [...] } }  (nested)
  const raw = json?.data?.data ?? json?.data ?? [];
  const items: Anime[] = (Array.isArray(raw) ? raw : []).map(mapAnime);
  return { status: json?.status === 'ok', data: items };
};

// ─── Series Detail ────────────────────────────────────────────────────────────
// Old: GET /detail?id=<animeId>
// New: GET /series?slug=<slug>
const fetchDetail = async (id: string): Promise<ApiResponse<AnimeDetail>> => {
  const json = await get<any>(`/series?slug=${encodeURIComponent(id)}`);
  const raw = json?.data;
  if (!raw) return { status: false, data: null as any };
  const anime = mapAnimeDetail(raw);
  return { status: json?.status === 'ok', data: anime };
};

// ─── Episode / Stream ─────────────────────────────────────────────────────────
// Old: GET /episode?id=<episodeId>
//      → { status, data: { server: [ { id, quality, link, type } ] } }
// New: GET /stream?post_id=<postId>&slug=<slug>&episode=<epNum>
//      → { status, data: [ { quality, url, ... } ] }
//
// Episode.id is encoded as "postId|slug|epNum" so we can unpack here.
const fetchEpisode = async (combinedId: string): Promise<any> => {
  const [post_id, slug, episode] = combinedId.split('|');
  const json = await get<any>(
    `/stream?post_id=${encodeURIComponent(post_id)}&slug=${encodeURIComponent(slug)}&episode=${encodeURIComponent(episode)}`
  );
  const streams: any[] = json?.data ?? [];
  const server = streams.map((s: any, i: number) => ({
    id: String(i),
    quality: s.quality ?? s.label ?? `Stream ${i + 1}`,
    link: s.url ?? s.link ?? '',
    type: 'direct',
  }));
  return { status: json?.status === 'ok', data: { server } };
};

// ─── Genre ────────────────────────────────────────────────────────────────────
// Not available in the new API — return empty gracefully
const fetchGenre = async (): Promise<ApiResponse<Genre[]>> => ({
  status: true,
  data: [],
});

const fetchGenreFilter = async (_ids: string[], _page = 0): Promise<ApiResponse<Anime[]>> => ({
  status: true,
  data: [],
});

// ─── Field mappers ────────────────────────────────────────────────────────────
function mapAnime(raw: any): Anime {
  return {
    id: raw.slug ?? raw.id ?? '',
    title: raw.title ?? raw.judul ?? '',
    image_poster: raw.poster ?? raw.image_poster ?? raw.thumbnail ?? '',
    image_cover: raw.cover ?? raw.image_cover ?? raw.poster ?? raw.thumbnail ?? '',
    synopsis: raw.synopsis ?? raw.sinopsis ?? raw.description ?? '',
    type: raw.type ?? raw.tipe ?? '',
    status: raw.status ?? '',
    year: raw.year ?? raw.tahun ?? '',
    aired_start: raw.aired ?? raw.aired_start ?? '',
    studio: raw.studio ?? '',
    genre: Array.isArray(raw.genre)
      ? raw.genre.map((g: any) => (typeof g === 'string' ? g : g.name)).join(', ')
      : raw.genre ?? '',
    day: raw.day ?? raw.hari ?? '',
    time: raw.time ?? raw.jam ?? '',
    key_time: raw.key_time ?? '',
  };
}

function mapAnimeDetail(raw: any): AnimeDetail {
  const base = mapAnime(raw);
  const postId = raw.post_id ?? raw.id ?? base.id;
  const slug = raw.slug ?? base.id;
  const episode_list = (raw.episodes ?? raw.episode_list ?? []).map((ep: any, i: number) => ({
    id: `${postId}|${slug}|${ep.episode ?? ep.index ?? ep.number ?? i + 1}`,
    index: ep.episode ?? ep.index ?? ep.number ?? i + 1,
    title: ep.title ?? `Episode ${ep.episode ?? i + 1}`,
  }));
  return { ...base, episode_list };
}

// ─── Public API object (same interface as before) ─────────────────────────────
export const api = {
  home: () => Promise.all([
    fetchSchedule(),
    fetchOngoing(),
    fetchPopular(),
  ]),

  detail: (id: string) => fetchDetail(id),
  episode: (id: string) => fetchEpisode(id),
  search: (q: string, page = 0) => fetchSearch(q, page),
  popular: (page = 0) => fetchPopular(page),
  ongoing: (page = 0) => fetchOngoing(page),
  schedule: () => fetchSchedule(),
  genre: () => fetchGenre(),
  genreFilter: (ids: string[], page = 0) => fetchGenreFilter(ids, page),
};

export const getProxyUrl = (url: string) => `${PROXY_BASE}${url}`;

export const getAnimeSlug = (anime: Anime) =>
  `${anime.id}-${(anime.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

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

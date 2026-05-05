import { API_BASE, PROXY_BASE } from '@/constants';
import { ApiResponse, Anime, AnimeDetail, ScheduleDay, Genre } from '@/types';

const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`);
  return res.json();
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapAnime(raw: any): Anime {
  return {
    id:           (raw.url ?? raw.series_id ?? String(raw.id ?? '')).replace(/\/+$/, ''),
    title:        raw.judul ?? raw.anime_name ?? '',
    image_poster: raw.cover ?? '',
    image_cover:  raw.cover ?? '',
    synopsis:     raw.sinopsis ?? '',
    type:         raw.type ?? '',
    status:       raw.status ?? '',
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

function mapAnimeDetail(raw: any): AnimeDetail {
  const base = mapAnime(raw);
  // chapters dibalik supaya ep 1 di index 0
  const chapters: any[] = [...(raw.chapter ?? [])].reverse();
  const episode_list = chapters.map((ch: any) => ({
    // encode: chapterUrl|seriesSlug|epNumber — dipakai fetchEpisode
    id:    `${ch.url}|${raw.series_id}|${ch.ch}`,
    index: Number(ch.ch),
    title: `Episode ${ch.ch}`,
  }));
  return { ...base, episode_list };
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

// GET /ongoing?page=1
// data: [{ url, judul, cover, ... }]
const fetchOngoing = async (page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await get<any>(`/ongoing?page=${page + 1}`);
  return { status: json?.status === 'ok', data: (json?.data ?? []).map(mapAnime) };
};

// GET /rekomendasi
// data: [{ id, url, judul, cover, genre[], sinopsis, ... }]
const fetchPopular = async (_page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await get<any>('/rekomendasi');
  return { status: json?.status === 'ok', data: (json?.data ?? []).map(mapAnime) };
};

// GET /jadwal
// data: [{ day, date, animeList: [{ anime_name, id, link, cover }] }]
const fetchSchedule = async (): Promise<ApiResponse<ScheduleDay>> => {
  const json = await get<any>('/jadwal');
  const days: ScheduleDay = {};
  for (const item of json?.data ?? []) {
    const key = (item.day ?? '').toUpperCase(); // "SELASA", "RABU", dst
    days[key] = (item.animeList ?? []).map((a: any) => mapAnime({
      url:   a.link,
      judul: a.anime_name,
      cover: a.cover,
      id:    a.id,
    }));
  }
  return { status: json?.status === 'ok', data: days };
};

// GET /search?q=&page=1
// data: { result: [...], pagination: {} }
const fetchSearch = async (q: string, page = 0): Promise<ApiResponse<Anime[]>> => {
  const json = await get<any>(`/search?q=${encodeURIComponent(q)}&page=${page + 1}`);
  const result = json?.data?.result ?? [];
  return { status: json?.status === 'ok', data: result.map(mapAnime) };
};

// GET /series?slug=
// data: { id, series_id, judul, cover, chapter: [{ id, ch, url }] }
const fetchDetail = async (id: string): Promise<ApiResponse<AnimeDetail>> => {
  const json = await get<any>(`/series?slug=${encodeURIComponent(id)}`);
  if (!json?.data) return { status: false, data: null as any };
  return { status: json?.status === 'ok', data: mapAnimeDetail(json.data) };
};

// GET /stream?post_id=al-153610-5&slug=liar-game-sub-indo&episode=5
// data: { "360p": [{link, ...}], "720p": [...], ... }
// Episode.id encoded sebagai "chUrl|seriesSlug|epNum"
const fetchEpisode = async (combinedId: string): Promise<any> => {
  const [chUrl, slug, episode] = combinedId.split('|');
  const json = await get<any>(
    `/stream?post_id=${encodeURIComponent(chUrl)}&slug=${encodeURIComponent(slug)}&episode=${encodeURIComponent(episode)}`
  );

  // Normalize ke format lama: { status, data: { server: [{id, quality, link, type}] } }
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

  return { status: json?.status === 'ok', data: { server } };
};

// Genre tidak tersedia di API baru — return kosong aman
const fetchGenre = async (): Promise<ApiResponse<Genre[]>> => ({ status: true, data: [] });
const fetchGenreFilter = async (_ids: string[], _page = 0): Promise<ApiResponse<Anime[]>> => ({ status: true, data: [] });

// ─── Public API (interface sama persis seperti sebelumnya) ────────────────────

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
    // encodeURIComponent dulu supaya karakter non-ASCII aman di btoa
    const encodedId = btoa(unescape(encodeURIComponent(anime.id))).replace(/=/g, '');
    const titleKebab = (anime.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${encodedId}--${titleKebab}`;
  } catch {
    // fallback: langsung pakai id tanpa encode jika btoa gagal
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

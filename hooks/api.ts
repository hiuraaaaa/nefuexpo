import { API_BASE, PROXY_BASE } from '@/constants';
import { ApiResponse, Anime, AnimeDetail, ScheduleDay, Genre } from '@/types';

export const api = {
  get: async <T>(path: string): Promise<T> => {
    const res = await fetch(`${API_BASE}${path}`);
    const json = await res.json();
    return json;
  },

  home: () => Promise.all([
    api.get<ApiResponse<ScheduleDay>>('/schedule'),
    api.get<ApiResponse<Anime[]>>('/ongoing'),
    api.get<ApiResponse<Anime[]>>('/popular'),
  ]),

  detail: (id: string) => api.get<ApiResponse<AnimeDetail>>(`/detail?id=${id}`),

  episode: (id: string) => api.get<any>(`/episode?id=${id}`),

  search: (q: string, page = 0) =>
    api.get<ApiResponse<Anime[]>>(`/search?q=${encodeURIComponent(q)}&page=${page}`),

  popular: (page = 0) => api.get<ApiResponse<Anime[]>>(`/popular?page=${page}`),

  ongoing: (page = 0) => api.get<ApiResponse<Anime[]>>(`/ongoing?page=${page}`),

  schedule: () => api.get<ApiResponse<ScheduleDay>>('/schedule'),

  genre: () => api.get<ApiResponse<Genre[]>>('/genre'),

  genreFilter: (ids: string[], page = 0) => {
    const q = ids.map(id => `id=${id}`).join('&');
    return api.get<ApiResponse<Anime[]>>(`/genre?${q}&page=${page}`);
  },
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

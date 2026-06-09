export interface Anime {
  id: string;
  title: string;
  image_poster: string;
  image_cover: string;
  synopsis?: string;
  type?: string;
  status?: string;
  year?: string;
  aired_start?: string;
  studio?: string;
  genre?: string;
  synonyms?: string;
  favorites?: string | number;
  day?: string;
  date?: string;        // ← tambah
  date_ts?: number | null;  // ← tambah
  updated?: number | null;  // ← tambah ini
  time?: string;
  key_time?: string;
  // field tambahan dari API
  score?: string | null;
  total_episode?: number | null;
  last_chapter?: string | null;
  last_update?: string | null;
}

export interface Episode {
  id: string;
  index: number;
  title?: string;
  // field tambahan dari API
  chapter_id?: number | null;
  date?: string;
  views?: number;
  last_durasi?: number | null;
  full_durasi?: number | null;
}

export interface Server {
  id: string;
  quality: string;
  link: string;
  type: 'direct' | 'hls';
  // field tambahan dari API
  provide?: number | null;
  size_kb?: number | null;
  size?: string | null;
}

export interface AnimeDetail extends Anime {
  episode_list: Episode[];
  // field tambahan dari API
  rating?: string | null;
  countdown?: string | null;
  bookmark?: string | null;
  genreurl?: string[];
  history?: string[];
}

export interface ScheduleDay {
  [key: string]: Anime[];
}

export interface ApiResponse<T> {
  status: boolean;
  data: T;
}

export interface Genre {
  id: string;
  name: string;
}

export interface HistoryItem {
  anime: Anime;
  episodeIndex: number;
  timestamp: number;
}

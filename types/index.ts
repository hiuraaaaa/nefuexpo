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
  time?: string;
  key_time?: string;
}

export interface Episode {
  id: string;
  index: number;
  title?: string;
}

export interface Server {
  id: string;
  quality: string;
  link: string;
  type: string;
}

export interface AnimeDetail extends Anime {
  episode_list: Episode[];
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

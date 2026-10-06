export interface TmdbMovieSummary {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
}

export interface TmdbPaginated<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface TmdbVideo {
  key: string;
  site: string; // 'YouTube'
  type: string; // 'Trailer', 'Teaser'...
  official: boolean;
}

export interface TmdbMovieDetails extends TmdbMovieSummary {
  runtime: number | null; // minutos
  genres: TmdbGenre[];
  tagline: string;
  original_language: string;
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { english_name: string; iso_639_1: string }[];
  credits: {
    cast: TmdbCastMember[];
    crew: TmdbCrewMember[];
  };
  videos: {
    results: TmdbVideo[];
  };
}

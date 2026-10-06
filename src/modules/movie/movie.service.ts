import { Injectable } from '@nestjs/common';
import { TmdbService } from '../tmdb/tmdb.service';
import { TmdbMovieSummary } from '../tmdb/tmdb.types';

const IMG = 'https://image.tmdb.org/t/p';
const MIN_VOTES = 20;

const img = (path: string | null, size: string) =>
   path ? `${IMG}/${size}${path}` : null;

@Injectable()
export class MovieService {
   constructor(private readonly tmdb: TmdbService) {}

   private toSummary(m: TmdbMovieSummary) {
      return {
         id: m.id,
         title: m.title,
         year: m.release_date?.slice(0, 4) ?? null,
         rating:
            m.vote_count >= MIN_VOTES
               ? Math.round((m.vote_average / 2) * 10) / 10
               : null,
         poster: img(m.poster_path, 'w500'),
         backdrop: img(m.backdrop_path, 'w1280'),
      };
   }

   async trending() {
      const data = await this.tmdb.trending();
      return data.results.slice(1).map((m) => this.toSummary(m)); //puklando o primeiro pq vai ser sempre o filme da semana
   }

   async search(query: string, page = 1) {
      const q = query?.trim().toLowerCase();

      if (!q) return { page: 1, totalPages: 0, results: [] };

      const data = await this.tmdb.search(q, page);

      return {
         page: data.page,
         totalPages: data.total_pages,
         results: data.results.map((m) => this.toSummary(m)),
      };
   }

   async recommendations(id: number) {
      const data = await this.tmdb.recommendations(id);
      return data.results.slice(0, 10).map((m) => this.toSummary(m));
   }

   async details(id: number) {
      const m = await this.tmdb.details(id);

      const director = m.credits.crew.find((c) => c.job === 'Director');
      const trailer =
         m.videos.results.find(
            (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official,
         ) ??
         m.videos.results.find(
            (v) => v.site === 'YouTube' && v.type === 'Trailer',
         );

      return {
         ...this.toSummary(m), // id, title, year, rating, poster, backdrop
         overview: m.overview,
         tagline: m.tagline,
         runtime: m.runtime, // minutos, o front formata "2h 18min"
         genres: m.genres.map((g) => g.name),
         director: director?.name ?? null,
         cast: m.credits.cast.slice(0, 8).map((c) => ({
            id: c.id,
            name: c.name,
            character: c.character,
            photo: img(c.profile_path, 'w185'),
         })),
         trailerUrl: trailer
            ? `https://www.youtube.com/watch?v=${trailer.key}`
            : null,
         countries: m.production_countries.map((c) => c.name),
         languages: m.spoken_languages.map((l) => l.english_name),
      };
   }

   async featured() {
      const trending = await this.tmdb.trending();
      const first = trending.results[0];
      return this.details(first.id);
   }

   async inTheaters() {
      const [now, soon] = await Promise.all([
         this.tmdb.nowPlaying(),
         this.tmdb.upcoming(),
      ]);

      const nowItems = now.results.slice(0, 3);
      const nowIds = new Set(nowItems.map((m) => m.id));

      // upcoming pode repetir filme que já está em cartaz
      const soonItems = soon.results
         .filter((m) => !nowIds.has(m.id))
         .slice(0, 2);

      const items = [
         ...nowItems.map((m) => ({
            ...this.toSummary(m),
            status: 'now_playing' as const,
         })),
         ...soonItems.map((m) => ({
            ...this.toSummary(m),
            status: 'upcoming' as const,
         })),
      ];

      return items;
   }
}

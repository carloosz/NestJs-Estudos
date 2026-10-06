import { BadGatewayException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TmdbMovieDetails, TmdbMovieSummary, TmdbPaginated } from './tmdb.types';

@Injectable()
export class TmdbService {
   constructor(private readonly http: HttpService) {}

   private async get<T>(
      path: string,
      params: Record<string, any> = {},
   ): Promise<T> {
      try {
         const { data } = await firstValueFrom(
            this.http.get<T>(path, {
               params: { language: 'pt-BR', ...params },
            }),
         );
         return data;
      } catch {
         throw new BadGatewayException('Erro ao consultar a TMDB');
      }
   }

   trending() {
      return this.get<TmdbPaginated<TmdbMovieSummary>>('/trending/movie/week');
   }

   nowPlaying() {
      return this.get<TmdbPaginated<TmdbMovieSummary>>('/movie/now_playing', {
         region: 'BR',
      });
   }

   upcoming() {
      return this.get<TmdbPaginated<TmdbMovieSummary>>('/movie/upcoming', {
         region: 'BR',
      });
   }

   search(query: string, page = 1) {
      return this.get<TmdbPaginated<TmdbMovieSummary>>('/search/movie', {
         query,
         page,
      });
   }

   details(id: number) {
      return this.get<TmdbMovieDetails>(`/movie/${id}`, { append_to_response: 'credits,videos' });
   }

   recommendations(id: number) {
      return this.get<TmdbPaginated<TmdbMovieSummary>>(
         `/movie/${id}/recommendations`,
      );
   }
}

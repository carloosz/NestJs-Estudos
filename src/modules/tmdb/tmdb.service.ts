import { BadGatewayException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TmdbMovieDetails, TmdbMovieSummary, TmdbPaginated } from './tmdb.types';
import { AxiosError } from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

const HOUR = 60 * 60 * 1000;

@Injectable()
export class TmdbService {
   constructor(
      private readonly http: HttpService,
      @Inject(CACHE_MANAGER) private readonly cache: Cache,
   ) {}

   private async cached<T>(
      key: string,
      ttl: number,
      fetcher: () => Promise<T>,
   ): Promise<T> {
      const hit = await this.cache.get<T>(key);
      if (hit !== undefined && hit !== null) return hit;

      const data = await fetcher();
      await this.cache.set(key, data, ttl);
      return data;
   }

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
      } catch (e) {
         if (e instanceof AxiosError && e.response?.status === 404) {
            throw new NotFoundException('Filme não encontrado na TMDB');
         }
         throw new BadGatewayException('Erro ao consultar a TMDB');
      }
   }

   trending() {
      return this.cached('tmdb:trending', 1 * HOUR, () =>
         this.get<TmdbPaginated<TmdbMovieSummary>>('/trending/movie/week'),
      );
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
      return this.cached(`tmdb:details:${id}`, 12 * HOUR, () =>
         this.get<TmdbMovieDetails>(`/movie/${id}`, { append_to_response: 'credits,videos' }),
      );
   }

   recommendations(id: number) {
      return this.get<TmdbPaginated<TmdbMovieSummary>>(
         `/movie/${id}/recommendations`,
      );
   }

   summary(id: number) {
      return this.cached(`tmdb:movie:${id}`, 24 * HOUR, () =>
         this.get<TmdbMovieSummary>(`/movie/${id}`),
      );
   }
}

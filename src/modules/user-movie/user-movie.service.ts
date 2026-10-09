import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { TmdbService } from '../tmdb/tmdb.service';
import { RateMovieDto } from './dto/rate-movie.dto';
import { UserMovie } from './entities/user-movie.entity';
import { Not, Repository, IsNull } from 'typeorm';
import { UserMovieStateDto } from './dto/user-movie-state.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserMovieService {
   constructor(
      private readonly tmdb: TmdbService,
      @InjectRepository(UserMovie)
      private readonly userMovieRepository: Repository<UserMovie>,
   ) {}

   private async getOrCreate(userId: string, tmdbId: number) {
      return (
         (await this.userMovieRepository.findOneBy({ userId, tmdbId })) ??
         this.userMovieRepository.create({ userId, tmdbId })
      );
   }

   private async saveOrRemove(um: UserMovie) {
      const empty =
         !um.watchedAt &&
         !um.favorite &&
         !um.watchlistedAt &&
         !um.rating &&
         !um.review;

      if (empty) {
         if (um.id) await this.userMovieRepository.remove(um);
         return this.toState(null);
      }
      const saved = await this.userMovieRepository.save(um);
      return this.toState(saved);
   }

   private toState(um: UserMovie | null) {
      return {
         watched: !!um?.watchedAt,
         favorite: !!um?.favorite,
         inWatchlist: !!um?.watchlistedAt,
         rating: um?.rating ?? null,
         review: um?.review ?? null,
      };
   }

   async rateMovie(userId: string, tmdbId: number, dto: RateMovieDto) {
      if (dto.rating === undefined && dto.review === undefined) {
         throw new BadRequestException('Informe rating e/ou review');
      }

      await this.tmdb.details(tmdbId); // lanca 404 se o filme não existir

      const userMovie =
         (await this.userMovieRepository.findOneBy({ userId, tmdbId })) ??
         this.userMovieRepository.create({ userId, tmdbId });

      if (dto.rating !== undefined) userMovie.rating = dto.rating;
      if (dto.review !== undefined) {
         const text = dto.review?.trim() || null;
         // aqui: se userMovie.review existia e text é null, apagar likes e comentários
         userMovie.review = text;
      }

      if (!userMovie.rating && !userMovie.review) {
         userMovie.ratedAt = null;
      } else {
         userMovie.ratedAt = new Date();
         userMovie.watchedAt ??= new Date();
         userMovie.watchlistedAt = null;
      }

      // linha nova sem nada pra guardar: nao cria
      const empty =
         !userMovie.watchedAt &&
         !userMovie.favorite &&
         !userMovie.watchlistedAt &&
         !userMovie.rating &&
         !userMovie.review;
      if (empty) {
         if (userMovie.id) await this.userMovieRepository.remove(userMovie);
         return this.toState(null);
      }

      const saved = await this.userMovieRepository.save(userMovie);
      return this.toState(saved);
   }

   async setFavorite(userId: string, tmdbId: number, value: boolean) {
      if (value) await this.tmdb.details(tmdbId);

      const um = await this.getOrCreate(userId, tmdbId);
      um.favorite = value;
      if (value) {
         um.watchedAt ??= new Date();
         um.watchlistedAt = null;
      }
      return this.saveOrRemove(um);
   }

   async setWatched(userId: string, tmdbId: number, value: boolean) {
      if (value) await this.tmdb.details(tmdbId);

      const um = await this.getOrCreate(userId, tmdbId);

      if (value) {
         um.watchedAt ??= new Date();
         um.watchlistedAt = null; // assistido sai da watchlist
      } else {
         // desassistir: favorito e avaliação dependem de "assistido", então saem juntos
         um.watchedAt = null;
         um.favorite = false;
         um.rating = null;
         um.ratedAt = null;
         if (um.review) {
            //apagar likes e comentários
            um.review = null;
         }
      }
      return this.saveOrRemove(um);
   }

   async setWatchlist(userId: string, tmdbId: number, value: boolean) {
      if (value) await this.tmdb.details(tmdbId);

      const um = await this.getOrCreate(userId, tmdbId);

      if (value) {
         if (um.watchedAt) {
            throw new ConflictException(
               'Esse filme já está marcado como assistido',
            );
         }
         um.watchlistedAt ??= new Date();
      } else {
         um.watchlistedAt = null;
      }
      return this.saveOrRemove(um);
   }

   async getState(userId: string, tmdbId: number): Promise<UserMovieStateDto> {
      const um = await this.userMovieRepository.findOneBy({ userId, tmdbId });
      return this.toState(um);
   }

   async getWatchedMovies(userId: string, page: number, limit: number) {
      const [movies, total] = await this.userMovieRepository.findAndCount({
         where: { userId, watchedAt: Not(IsNull()) },
         order: { watchedAt: 'DESC' },
         skip: (page - 1) * limit,
         take: limit,
      });
   }
}

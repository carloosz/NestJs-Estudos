import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { TmdbService } from '../tmdb/tmdb.service';
import { RateMovieDto } from './dto/rate-movie.dto';
import { UserMovie } from './entities/user-movie.entity';
import { Not, Repository, IsNull, FindOptionsOrder, FindOptionsWhere, MoreThanOrEqual, In } from 'typeorm';
import { UserMovieStateDto } from './dto/user-movie-state.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { tmdbImage } from '../../common/tmdb-image';
import { User } from '../user/entities/user.entity';
import { TmdbListItem } from '../tmdb/tmdb.types';
import { env } from 'process';
import { ReviewLike } from './entities/review-like.entity';
import { ReviewSort } from './enum/review-sort.enum';
import { Follow } from '../follow/entities/follow.entity';
@Injectable()
export class UserMovieService {
   constructor(
      private readonly tmdb: TmdbService,
      @InjectRepository(UserMovie)
      private readonly userMovieRepository: Repository<UserMovie>,
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
      @InjectRepository(ReviewLike)
      private readonly likeRepository: Repository<ReviewLike>,
      @InjectRepository(Follow)
      private readonly followRepository: Repository<Follow>,
   ) {}

   private avatarUrl(user?: User) {
      const photo = user?.uploads.find((u) => u.active && u.type === 'avatar');
      return photo ? `${env.API_URL}/files/${photo.filename}` : null;
   }

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

   private async listMovies<E extends object>(
      where: FindOptionsWhere<UserMovie>,
      order: FindOptionsOrder<UserMovie>,
      page: number,
      limit: number,
      extra: (row: UserMovie) => E,
      withDirector = false,
   ) {
      const exists = await this.userRepository.exists({
         where: { id: where.userId },
      });
      if (!exists) {
         throw new NotFoundException('Usuário não encontrado');
      }

      const [rows, total] = await this.userMovieRepository.findAndCount({
         where,
         order: { ...order, id: 'DESC' },
         skip: (page - 1) * limit,
         take: limit,
      });

      const settled = await Promise.allSettled(
         rows.map((r): Promise<TmdbListItem> =>
            withDirector
               ? this.tmdb.cardWithDirector(r.tmdbId)
               : this.tmdb.summary(r.tmdbId),
         ),
      );

      const results = settled.flatMap((s, i) =>
         s.status === 'fulfilled'
            ? [
                 {
                    id: s.value.id,
                    title: s.value.title,
                    year: s.value.release_date?.slice(0, 4) ?? null,
                    poster: tmdbImage(s.value.poster_path, 'w342'),
                    director: s.value.director,
                    ...extra(rows[i]),
                 },
              ]
            : [],
      );

      return {
         page,
         totalPages: Math.ceil(total / limit),
         totalResults: total,
         results,
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

   getWatched(userId: string, page: number, limit: number) {
      return this.listMovies(
         { userId, watchedAt: Not(IsNull()) },
         { watchedAt: 'DESC' },
         page,
         limit,
         (r) => ({ watchedAt: r.watchedAt }),
      );
   }

   getFavorites(userId: string, page: number, limit: number) {
      return this.listMovies(
         { userId, favorite: true },
         { updatedAt: 'DESC' },
         page,
         limit,
         (r) => ({ favorite: r.favorite }),
      );
   }

   getWatchlist(userId: string, page: number, limit: number) {
      return this.listMovies(
         { userId, watchlistedAt: Not(IsNull()) },
         { watchlistedAt: 'DESC' },
         page,
         limit,
         (r) => ({ watchlistedAt: r.watchlistedAt }),
         true,
      );
   }

   getRateds(userId: string, page: number, limit: number) {
      return this.listMovies(
         { userId, ratedAt: Not(IsNull()) },
         { ratedAt: 'DESC' },
         page,
         limit,
         (r) => ({
            ratedAt: r.ratedAt,
            rating: r.rating,
            review: r.review,
            favorite: r.favorite,
            watchedAt: r.watchedAt,
         }),
         true,
      );
   }

   async getStats(userId: string) {
      const now = new Date();
      const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

      const [watched, thisYear, rated, followers, following] = await Promise.all([
         this.userMovieRepository.countBy({ userId, watchedAt: Not(IsNull()) }),
         this.userMovieRepository.countBy({
            userId,
            watchedAt: MoreThanOrEqual(startOfYear),
         }),
         this.userMovieRepository.countBy({ userId, ratedAt: Not(IsNull()) }),
         this.followRepository.countBy({ following: { id: userId } }),
         this.followRepository.countBy({ follower: { id: userId } }),
      ]);

      return { watched, thisYear, rated, followers, following };
   }

   async getCommunityRatings(tmdbIds: number[]) {
      if (!tmdbIds.length)
         return new Map<number, { average: number; count: number }>();

      const rows = await this.userMovieRepository
         .createQueryBuilder('um')
         .select('um.tmdbId', 'tmdbId')
         .addSelect('AVG(um.rating)', 'average')
         .addSelect('COUNT(um.rating)', 'count')
         .where('um.tmdbId IN (:...ids)', { ids: tmdbIds })
         .andWhere('um.rating IS NOT NULL')
         .groupBy('um.tmdbId')
         .getRawMany<{ tmdbId: number; average: string; count: string }>();

      return new Map(
         rows.map((r) => [
            Number(r.tmdbId),
            { average: Number(r.average), count: Number(r.count) },
         ]),
      );
   }

   private async findReviewsPage(
      tmdbId: number,
      page: number,
      limit: number,
      sort: ReviewSort,
   ): Promise<[UserMovie[], number]> {
      const where = { tmdbId, review: Not(IsNull()) };
      const offset = (page - 1) * limit;

      if (sort === ReviewSort.Newest) {
         return this.userMovieRepository.findAndCount({
            where,
            order: { ratedAt: 'DESC', id: 'DESC' },
            skip: offset,
            take: limit,
         });
      }

      // popular: 1) ids da página ordenados por likes
      const total = await this.userMovieRepository.count({ where });

      const rows = await this.userMovieRepository
         .createQueryBuilder('um')
         .select('um.id', 'id')
         .leftJoin(ReviewLike, 'l', 'l.userMovieId = um.id')
         .where('um.tmdbId = :tmdbId', { tmdbId })
         .andWhere('um.review IS NOT NULL')
         .groupBy('um.id')
         .orderBy('COUNT(l.id)', 'DESC')
         .addOrderBy('um.ratedAt', 'DESC')
         .addOrderBy('um.id', 'DESC')
         .offset(offset)
         .limit(limit)
         .getRawMany<{ id: string }>();

      // 2) carrega as linhas e devolve na mesma ordem dos ids
      const ids = rows.map((r) => r.id);
      if (!ids.length) return [[], total];

      const entities = await this.userMovieRepository.findBy({ id: In(ids) });
      const byId = new Map(entities.map((e) => [e.id, e]));
      const reviews = ids
         .map((id) => byId.get(id))
         .filter((e): e is UserMovie => !!e);

      return [reviews, total];
   }

   async getReviewsByMovie(
      tmdbId: number,
      page: number,
      limit: number,
      sort: ReviewSort,
      userId?: string,
   ) {
      const [reviews, totalResults] = await this.findReviewsPage(
         tmdbId,
         page,
         limit,
         sort,
      );

      const base = {
         page,
         totalPages: Math.ceil(totalResults / limit),
         totalResults,
      };
      if (!reviews.length) return { ...base, results: [] };

      const users = await this.userRepository.find({
         where: { id: In(reviews.map((r) => r.userId)) },
         select: { id: true, nickname: true },
         relations: { uploads: true },
      });
      const byId = new Map(users.map((u) => [u.id, u]));

      const counts = await this.likeRepository
         .createQueryBuilder('l')
         .select('l.userMovieId', 'reviewId')
         .addSelect('COUNT(*)', 'count')
         .where('l.userMovieId IN (:...ids)', { ids: reviews.map((r) => r.id) })
         .groupBy('l.userMovieId')
         .getRawMany<{ reviewId: string; count: string }>();

      const likesById = new Map(
         counts.map((c) => [c.reviewId, Number(c.count)]),
      );

      const userLikes = userId
         ? await this.likeRepository.find({
              where: { userMovieId: In(reviews.map((r) => r.id)), userId },
              select: { userMovieId: true },
           })
         : [];

      const likedIds = new Set(userLikes.map((l) => l.userMovieId));

      const results = reviews.map((r) => {
         const user = byId.get(r.userId);
         return {
            id: r.id,
            user: {
               id: r.userId,
               nickname: user?.nickname ?? null,
               avatar: this.avatarUrl(user),
            },
            rating: r.rating,
            favorite: r.favorite,
            review: r.review,
            ratedAt: r.ratedAt,
            likes: likesById.get(r.id) || 0,
            liked: likedIds.has(r.id),
         };
      });

      return { ...base, results };
   }

   async likeReview(userId: string, reviewId: string) {
      const review = await this.userMovieRepository.findOne({
         where: { id: reviewId },
         select: { id: true, userId: true, review: true },
      });
      if (!review?.review)
         throw new NotFoundException('Avaliação não encontrada');
      if (review.userId === userId) {
         throw new BadRequestException(
            'Você não pode curtir a própria avaliação',
         );
      }

      await this.likeRepository
         .createQueryBuilder()
         .insert()
         .values({ userMovieId: reviewId, userId })
         .orIgnore() // ON CONFLICT DO NOTHING: segundo clique não dá erro
         .execute();

      return this.likeState(reviewId, true);
   }

   async unlikeReview(userId: string, reviewId: string) {
      await this.likeRepository.delete({ userMovieId: reviewId, userId });
      return this.likeState(reviewId, false);
   }

   private async likeState(reviewId: string, liked: boolean) {
      return {
         liked,
         likes: await this.likeRepository.countBy({ userMovieId: reviewId }),
      };
   }
}

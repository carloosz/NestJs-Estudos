import {
   Injectable,
   BadRequestException,
   ConflictException,
   NotFoundException,
} from '@nestjs/common';
import { TmdbService } from '../tmdb/tmdb.service';
import { RateMovieDto } from './dto/rate-movie.dto';
import { UserMovie } from './entities/user-movie.entity';
import {
   Not,
   Repository,
   IsNull,
   FindOptionsOrder,
   FindOptionsWhere,
   MoreThanOrEqual,
   In,
} from 'typeorm';
import { UserMovieStateDto } from './dto/user-movie-state.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { tmdbImage } from '../../common/tmdb-image';
import { User } from '../user/entities/user.entity';
import { TmdbListItem } from '../tmdb/tmdb.types';
import { env } from 'process';
import { ReviewLike } from './entities/review-like.entity';
import { ReviewSort } from './enum/review-sort.enum';
import { Follow } from '../follow/entities/follow.entity';

type ReviewFilters = { tmdbId?: number; since?: Date };
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

   getWatched(
      userId: string,
      page: number,
      limit: number,
      onlyFavorites = false,
   ) {
      return this.listMovies(
         {
            userId,
            watchedAt: Not(IsNull()),
            ...(onlyFavorites && { favorite: true }),
         },
         { watchedAt: 'DESC' },
         page,
         limit,
         (r) => ({
            watchedAt: r.watchedAt,
            rating: r.rating,
            favorite: r.favorite,
            hasReview: !!r.review,
         }),
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

      const [
         watched,
         thisYear,
         rated,
         followers,
         following,
         watchlist,
         favorites,
         agg,
      ] = await Promise.all([
         this.userMovieRepository.countBy({ userId, watchedAt: Not(IsNull()) }),
         this.userMovieRepository.countBy({
            userId,
            watchedAt: MoreThanOrEqual(startOfYear),
         }),
         this.userMovieRepository.countBy({ userId, ratedAt: Not(IsNull()) }),
         this.followRepository.countBy({ following: { id: userId } }),
         this.followRepository.countBy({ follower: { id: userId } }),
         this.userMovieRepository.countBy({
            userId,
            watchlistedAt: Not(IsNull()),
         }),
         this.userMovieRepository.countBy({ userId, favorite: true }),
         this.userMovieRepository
            .createQueryBuilder('um')
            .select('AVG(um.rating)', 'avg')
            .addSelect('MIN(um.watchedAt)', 'since')
            .where('um.userId = :userId', { userId })
            .getRawOne<{ avg: string | null; since: Date | null }>(),
      ]);

      return {
         watched,
         thisYear,
         rated,
         followers,
         following,
         watchlist,
         favorites,
         averageRating: agg?.avg ? Math.round(Number(agg.avg) * 10) / 10 : null,
         watchedSince: agg?.since ?? null,
      };
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
      filters: ReviewFilters,
      page: number,
      limit: number,
      sort: ReviewSort,
   ): Promise<[UserMovie[], number]> {
      const where: FindOptionsWhere<UserMovie> = {
         review: Not(IsNull()),
         ...(filters.tmdbId !== undefined && { tmdbId: filters.tmdbId }),
         ...(filters.since && { ratedAt: MoreThanOrEqual(filters.since) }),
      };
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

      const qb = this.userMovieRepository
         .createQueryBuilder('um')
         .select('um.id', 'id')
         .leftJoin(ReviewLike, 'l', 'l.userMovieId = um.id')
         .where('um.review IS NOT NULL');

      if (filters.tmdbId !== undefined) {
         qb.andWhere('um.tmdbId = :tmdbId', { tmdbId: filters.tmdbId });
      }
      if (filters.since) {
         qb.andWhere('um.ratedAt >= :since', { since: filters.since });
      }

      const rows = await qb
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
         { tmdbId },
         page,
         limit,
         sort,
      );

      return {
         page,
         totalPages: Math.ceil(totalResults / limit),
         totalResults,
         results: await this.buildReviewCards(reviews, userId),
      };
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

   private async loadMovieSummaries(tmdbIds: number[]) {
      const settled = await Promise.allSettled(
         [...new Set(tmdbIds)].map((id) => this.tmdb.summary(id)),
      );

      const byId = new Map<
         number,
         { id: number; title: string; poster: string | null }
      >();
      for (const s of settled) {
         if (s.status === 'fulfilled') {
            byId.set(s.value.id, {
               id: s.value.id,
               title: s.value.title,
               poster: tmdbImage(s.value.poster_path, 'w185'),
            });
         }
      }
      return byId;
   }

   private async buildReviewCards(
      reviews: UserMovie[],
      viewerId?: string,
      withMovie = false,
   ) {
      if (!reviews.length) return [];

      const reviewIds = reviews.map((r) => r.id);

      const [users, counts, viewerLikes, movieById] = await Promise.all([
         this.userRepository.find({
            where: { id: In([...new Set(reviews.map((r) => r.userId))]) },
            select: { id: true, nickname: true },
            relations: { uploads: true },
         }),
         this.likeRepository
            .createQueryBuilder('l')
            .select('l.userMovieId', 'reviewId')
            .addSelect('COUNT(*)', 'count')
            .where('l.userMovieId IN (:...ids)', { ids: reviewIds })
            .groupBy('l.userMovieId')
            .getRawMany<{ reviewId: string; count: string }>(),
         viewerId
            ? this.likeRepository.find({
                 where: { userMovieId: In(reviewIds), userId: viewerId },
                 select: { userMovieId: true },
              })
            : Promise.resolve([] as ReviewLike[]),
         withMovie
            ? this.loadMovieSummaries(reviews.map((r) => r.tmdbId))
            : Promise.resolve(
                 new Map<
                    number,
                    { id: number; title: string; poster: string | null }
                 >(),
              ),
      ]);

      const userById = new Map(users.map((u) => [u.id, u]));
      const likesById = new Map(
         counts.map((c) => [c.reviewId, Number(c.count)]),
      );
      const likedIds = new Set(viewerLikes.map((l) => l.userMovieId));

      const cards = reviews.map((r) => {
         const user = userById.get(r.userId);
         return {
            id: r.id, // reviewId, pro botão de curtir
            user: {
               id: r.userId,
               nickname: user?.nickname ?? null,
               avatar: this.avatarUrl(user),
            },
            rating: r.rating,
            favorite: r.favorite,
            review: r.review,
            ratedAt: r.ratedAt,
            likes: likesById.get(r.id) ?? 0,
            liked: likedIds.has(r.id),
            ...(withMovie && { movie: movieById.get(r.tmdbId) ?? null }),
         };
      });

      // card sem filme carregado ficaria sem título e pôster: melhor omitir
      return withMovie ? cards.filter((c) => c.movie) : cards;
   }

   FEATURED_WINDOW_DAYS = 30;

   async getFeaturedReviews(limit: number, viewerId?: string) {
      const since = new Date(
         Date.now() - this.FEATURED_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      );

      let [reviews] = await this.findReviewsPage(
         { since },
         1,
         limit,
         ReviewSort.Popular,
      );

      // app com pouco movimento: completa com as mais curtidas de qualquer época
      if (reviews.length < limit) {
         [reviews] = await this.findReviewsPage(
            {},
            1,
            limit,
            ReviewSort.Popular,
         );
      }

      return this.buildReviewCards(reviews, viewerId, true);
   }
}

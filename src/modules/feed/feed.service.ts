import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMovie } from '../user-movie/entities/user-movie.entity';
import { UserMovieService } from '../user-movie/user-movie.service';
import { Follow } from '../follow/entities/follow.entity';

const ACTIVITY_AT = `GREATEST(
  COALESCE(um."ratedAt", 'epoch'::timestamptz),
  COALESCE(um."watchedAt", 'epoch'::timestamptz),
  COALESCE(um."watchlistedAt", 'epoch'::timestamptz)
)`;

type ActivityType = 'rated' | 'watched' | 'watchlisted';

const typeOf = (r: UserMovie): ActivityType =>
   r.rating || r.review ? 'rated' : r.watchedAt ? 'watched' : 'watchlisted';

const atOf = (r: UserMovie) =>
   new Date(
      Math.max(
         ...[r.ratedAt, r.watchedAt, r.watchlistedAt]
            .filter((d): d is Date => !!d)
            .map((d) => d.getTime()),
      ),
   );

@Injectable()
export class FeedService {
   constructor(
      @InjectRepository(UserMovie)
      private readonly userMovieRepository: Repository<UserMovie>,
      private readonly userMovieService: UserMovieService,
   ) {}

   async getFriendsActivity(userId: string, page: number, limit: number) {
      const rows = await this.userMovieRepository
         .createQueryBuilder('um')
         .innerJoin(
            Follow,
            'f',
            'f."followingId" = um."userId" AND f."followerId" = :me',
            { me: userId },
         )
         .orderBy(ACTIVITY_AT, 'DESC')
         .addOrderBy('um.id', 'DESC')
         .offset((page - 1) * limit)
         .limit(limit + 1) // um a mais, só pra saber se existe próxima página
         .getMany();

      const hasMore = rows.length > limit;
      const pageRows = rows.slice(0, limit);

      const cards = await this.userMovieService.buildReviewCards(
         pageRows,
         userId,
         true,
      );
      const cardById = new Map(cards.map((c) => [c.id, c]));

      const results = pageRows.flatMap((r) => {
         const card = cardById.get(r.id);
         if (!card) return []; // filme que não carregou na tmdb

         return [
            {
               type: typeOf(r),
               at: atOf(r),
               reviewId: r.review ? r.id : null, // sem crtica, sem botão de curtir
               user: card.user,
               movie: card.movie,
               favorite: card.favorite,
               rating: card.rating,
               review: card.review,
               likes: card.likes,
               liked: card.liked,
            },
         ];
      });

      return { page, hasMore, results };
   }
}

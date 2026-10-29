import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMovie } from '../user-movie/entities/user-movie.entity';
import { Follow } from '../follow/entities/follow.entity';
import { UserMovieModule } from '../user-movie/user-movie.module';

@Module({
   imports: [TypeOrmModule.forFeature([UserMovie, Follow]), UserMovieModule],
   controllers: [FeedController],
   providers: [FeedService],
})
export class FeedModule {}

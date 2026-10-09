import { Module } from '@nestjs/common';
import { UserMovieService } from './user-movie.service';
import { UserMovieController } from './user-movie.controller';
import { TmdbModule } from '../tmdb/tmdb.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMovie } from './entities/user-movie.entity';

@Module({
  controllers: [UserMovieController],
  providers: [UserMovieService],
  imports: [TypeOrmModule.forFeature([UserMovie]), TmdbModule],
  exports: [UserMovieService],
})
export class UserMovieModule {}

import { Module } from '@nestjs/common';
import { UserMovieService } from './user-movie.service';
import { UserMovieController } from './user-movie.controller';
import { TmdbModule } from '../tmdb/tmdb.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMovie } from './entities/user-movie.entity';
import { ProfileMoviesController } from './profile-movies.controller';
import { User } from '../user/entities/user.entity';

@Module({
   controllers: [UserMovieController, ProfileMoviesController],
   providers: [UserMovieService],
   imports: [TypeOrmModule.forFeature([UserMovie, User]), TmdbModule],
   exports: [UserMovieService],
})
export class UserMovieModule {}

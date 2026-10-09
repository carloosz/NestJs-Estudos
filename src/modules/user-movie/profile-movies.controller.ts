import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserMovieService } from './user-movie.service';
import { DefaultValuePipe, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';

@Controller('users/:userId')
export class ProfileMoviesController {
  constructor(private readonly userMovieService: UserMovieService) {}

   @Get('users/:userId/watched')
   getWatched(
      @Param('userId', ParseUUIDPipe) userId: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
   ) {
      return this.userMovieService.getWatchedMovies(
         userId,
         Math.max(page, 1),
         Math.min(Math.max(limit, 1), 50),
      );
   }
}

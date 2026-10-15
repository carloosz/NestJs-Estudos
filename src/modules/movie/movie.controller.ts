import { Controller, Get, Param, ParseIntPipe, Query, DefaultValuePipe } from '@nestjs/common';
import { MovieService } from './movie.service';
import { ApiOperation } from '@nestjs/swagger';
import { UserMovieService } from '../user-movie/user-movie.service';

@Controller('movies')
export class MovieController {
   constructor(
      private readonly movieService: MovieService,
      private readonly userMovieService: UserMovieService,
   ) {}

   @ApiOperation({ summary: 'Get trending movies' })
   @Get('trending')
   trending() {
      return this.movieService.trending();
   }

   @ApiOperation({ summary: 'Search movies' })
   @Get('search')
   search(@Query('q') q: string, @Query('page') page?: string) {
      return this.movieService.search(q, page ? Number(page) : 1);
   }

   @ApiOperation({
      summary: 'Get movie recommendations based on a specific movie',
   })
   @Get(':id/recommendations')
   recommendations(@Param('id', ParseIntPipe) id: number) {
      return this.movieService.recommendations(id);
   }

   @ApiOperation({ summary: 'Get featured movie of the week' })
   @Get('featured')
   featured() {
      return this.movieService.featured();
   }

   @Get('in-theaters')
   inTheaters() {
      return this.movieService.inTheaters();
   }

   @ApiOperation({ summary: 'Get movie details' })
   @Get(':id')
   details(@Param('id', ParseIntPipe) id: number) {
      return this.movieService.details(id);
   }

   @Get(':id/reviews')
   reviews(
      @Param('id', ParseIntPipe) id: number,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
   ) {
      return this.userMovieService.getReviewsByMovie(
         id,
         Math.max(page, 1),
         Math.min(Math.max(limit, 1), 50),
         'newest', // por enquanto fixo
      );
   }
}

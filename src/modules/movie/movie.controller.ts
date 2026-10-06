import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { MovieService } from './movie.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('movies')
export class MovieController {
   constructor(private readonly movieService: MovieService) {}

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

   @ApiOperation({ summary: 'Get movie details' })
   @Get(':id')
   details(@Param('id', ParseIntPipe) id: number) {
      return this.movieService.details(id);
   }
}

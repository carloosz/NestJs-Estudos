import { Controller, Get, Param, ParseIntPipe, Query, UseInterceptors } from '@nestjs/common';
import { MovieService } from './movie.service';
import { ApiOperation } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@Controller('movies')
export class MovieController {
   constructor(private readonly movieService: MovieService) {}

   @ApiOperation({ summary: 'Get trending movies' })
   @UseInterceptors(CacheInterceptor)
   @CacheTTL(60 * 60 * 6 * 1000) // deixar cacheado por 6h
   @Get('trending')
   trending() {
      return this.movieService.trending();
   }

   @ApiOperation({ summary: 'Search movies' })
   @UseInterceptors(CacheInterceptor)
   @CacheTTL(60 * 60 * 1 * 1000)
   @Get('search')

   search(@Query('q') q: string, @Query('page') page?: string) {
      return this.movieService.search(q, page ? Number(page) : 1);
   }

   @ApiOperation({
      summary: 'Get movie recommendations based on a specific movie',
   })
   @UseInterceptors(CacheInterceptor)
   @CacheTTL(60 * 60 * 6 * 1000)
   @Get(':id/recommendations')

   recommendations(@Param('id', ParseIntPipe) id: number) {
      return this.movieService.recommendations(id);
   }

   @ApiOperation({ summary: 'Get featured movie of the week' })
   @UseInterceptors(CacheInterceptor)
   @CacheTTL(60 * 60 * 6 * 1000) // deixar cacheado por 6h
   @Get('featured')
   featured() {
      return this.movieService.featured();
   }

   @ApiOperation({ summary: 'Get movie details' })
   @UseInterceptors(CacheInterceptor)
   @CacheTTL(60 * 60 * 1 * 1000) // deixar cacheado por 1h
   @Get(':id')
   details(@Param('id', ParseIntPipe) id: number) {
      return this.movieService.details(id);
   }
}

import {
   Controller,
   Put,
   Param,
   ParseIntPipe,
   Body,
   Delete,
   Get,
} from '@nestjs/common';
import { UserMovieService } from './user-movie.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RateMovieDto } from './dto/rate-movie.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { RoleGuard } from '../role/guards/role.guard';
import { Roles } from '../role/decorator/roles.decorator';
import { RoleEnum } from '../role/enum/role.enum';
import { ApiOperation } from '@nestjs/swagger';

@Controller('user-movie')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(RoleEnum.Authenticated)
export class UserMovieController {
   constructor(private readonly userMovieService: UserMovieService) {}

   @ApiOperation({ summary: 'Rate movie' })
   @Put(':tmdbId/rating')
   rate(
      @CurrentUser('id') userId: string,
      @Param('tmdbId', ParseIntPipe) tmdbId: number,
      @Body() dto: RateMovieDto,
   ) {
      return this.userMovieService.rateMovie(userId, tmdbId, dto);
   }

   @ApiOperation({ summary: 'Set movie as favorite' })
   @Put(':tmdbId/favorite')
   favorite(
      @CurrentUser('id') userId: string,
      @Param('tmdbId', ParseIntPipe) tmdbId: number,
   ) {
      return this.userMovieService.setFavorite(userId, tmdbId, true);
   }

   @ApiOperation({ summary: 'Unfavorite movie' })
   @Delete(':tmdbId/favorite')
   unfavorite(
      @CurrentUser('id') userId: string,
      @Param('tmdbId', ParseIntPipe) tmdbId: number,
   ) {
      return this.userMovieService.setFavorite(userId, tmdbId, false);
   }

   @ApiOperation({ summary: 'Set movie as watched' })
   @Put(':tmdbId/watched')
   watched(
      @CurrentUser('id') userId: string,
      @Param('tmdbId', ParseIntPipe) tmdbId: number,
   ) {
      return this.userMovieService.setWatched(userId, tmdbId, true);
   }

   @ApiOperation({ summary: 'Unwatch movie' })
   @Delete(':tmdbId/watched')
   unwatched(
      @CurrentUser('id') userId: string,
      @Param('tmdbId', ParseIntPipe) tmdbId: number,
   ) {
      return this.userMovieService.setWatched(userId, tmdbId, false);
   }

   @ApiOperation({ summary: 'Add movie to watchlist' })
   @Put(':tmdbId/watchlist')
   addToWatchlist(
      @CurrentUser('id') userId: string,
      @Param('tmdbId', ParseIntPipe) tmdbId: number,
   ) {
      return this.userMovieService.setWatchlist(userId, tmdbId, true);
   }

   @ApiOperation({ summary: 'Remove movie from watchlist' })
   @Delete(':tmdbId/watchlist')
   removeFromWatchlist(
      @CurrentUser('id') userId: string,
      @Param('tmdbId', ParseIntPipe) tmdbId: number,
   ) {
      return this.userMovieService.setWatchlist(userId, tmdbId, false);
   }

   @ApiOperation({ summary: 'Get my state for a movie' })
   @Get(':tmdbId')
   state(
      @CurrentUser('id') userId: string,
      @Param('tmdbId', ParseIntPipe) tmdbId: number,
   ) {
      return this.userMovieService.getState(userId, tmdbId);
   }
}

import {
   Controller,
   Get,
   Param,
   ParseUUIDPipe,
   Query,
   DefaultValuePipe,
   ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FollowService } from './follow.service';
import { UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth-guard';

@Controller('public/follow')
export class PublicFollowController {
   constructor(private readonly followService: FollowService) {}

   @ApiOperation({ summary: 'Ver Seguidores de um usuário' })
   @Get(':userId/followers')
   @UseGuards(OptionalJwtAuthGuard)
   async getFollowers(
      @Param('userId', ParseUUIDPipe) userId: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(6), ParseIntPipe) limit: number,
      @Query('search', new DefaultValuePipe('')) search: string,
      @CurrentUser('id') loggedUserId?: string,
   ) {
      return this.followService.listUserFollowers(
         userId,
         loggedUserId,
         Math.max(page, 1),
         Math.min(Math.max(limit, 1), 50),
         search,
         false,
      );
   }

   @ApiOperation({ summary: 'Ver Seguindo de um usuário' })
   @Get(':userId/following')
   @UseGuards(OptionalJwtAuthGuard)
   async getFollowing(
      @Param('userId', ParseUUIDPipe) userId: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(6), ParseIntPipe) limit: number,
      @Query('search', new DefaultValuePipe('')) search: string,
      @CurrentUser('id') loggedUserId?: string,
   ) {
      return this.followService.listUserFollowers(
         userId,
         loggedUserId,
         Math.max(page, 1),
         Math.min(Math.max(limit, 1), 50),
         search,
         true,
      );
   }
}

import { Controller, Put, UseGuards, Param, ParseUUIDPipe, Delete } from '@nestjs/common';
import { FollowService } from './follow.service';
import { ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { Roles } from '../role/decorator/roles.decorator';
import { RoleEnum } from '../role/enum/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('follow')
export class FollowController {
   constructor(private readonly followService: FollowService) {}

   @ApiOperation({ summary: 'Seguir um usuário' })
   @UseGuards(JwtAuthGuard)
   @Roles(RoleEnum.Authenticated)
   @Put(':targetUserId')
   async follow(
      @CurrentUser('id', ParseUUIDPipe) loggedUserId: string,
      @Param('targetUserId', ParseUUIDPipe) targetUserId: string,
   ) {
      return this.followService.follow(loggedUserId, targetUserId);
   }

   @ApiOperation({ summary: 'Deixar de seguir um usuário' })
   @UseGuards(JwtAuthGuard)
   @Roles(RoleEnum.Authenticated)
   @Delete(':targetUserId')
   async unfollow(
      @CurrentUser('id', ParseUUIDPipe) loggedUserId: string,
      @Param('targetUserId', ParseUUIDPipe) targetUserId: string,
   ) {
      return this.followService.unfollow(loggedUserId, targetUserId);
   }
}

import {
   Controller,
   Get,
   Query,
   DefaultValuePipe,
   ParseIntPipe,
   UseGuards,
} from '@nestjs/common';
import { FeedService } from './feed.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { RoleGuard } from '../role/guards/role.guard';
import { Roles } from '../role/decorator/roles.decorator';
import { RoleEnum } from '../role/enum/role.enum';
import { ApiOperation } from '@nestjs/swagger';

@Controller('feed')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(RoleEnum.Authenticated)
export class FeedController {
   constructor(private readonly feedService: FeedService) {}

   @ApiOperation({ summary: 'Obter atividade dos amigos' })
   @Get('friends')
   friends(
      @CurrentUser('id') userId: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
   ) {
      return this.feedService.getFriendsActivity(
         userId,
         Math.max(page, 1),
         Math.min(Math.max(limit, 1), 20),
      );
   }
}

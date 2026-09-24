import { Controller, Post, HttpCode, UseGuards, Body } from '@nestjs/common';
import { AuthUser } from './decorator/auth-user.decorator';
import { UserDto } from 'src/modules/user/dto/user.dto';
import { LocalAuthGuard } from './guards/local-auth-guard';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
   constructor(private authService: AuthService) {}

   @UseGuards(LocalAuthGuard)
   @Post('login')
   @HttpCode(200)
   signIn(@AuthUser() user: UserDto) {
      return this.authService.signIn(user);
   }

   @Post('refresh')
   @ApiOperation({ summary: 'Refresh access token' })
   async refresh(@Body() dto: RefreshTokenDto) {
      return this.authService.refresh(dto.refreshToken);
   }
}

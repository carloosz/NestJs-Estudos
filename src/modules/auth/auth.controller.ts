import { Controller, Post, HttpCode, UseGuards } from '@nestjs/common';
import { AuthUser } from './decorator/auth-user.decorator';
import { UserDto } from 'src/modules/user/dto/user.dto';
import { LocalAuthGuard } from './guards/local-auth-guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
   constructor(private authService: AuthService) {}

   @UseGuards(LocalAuthGuard)
   @Post('login')
   @HttpCode(200)
   signIn(@AuthUser() user: UserDto) {
      return this.authService.signIn(user);
   }
}

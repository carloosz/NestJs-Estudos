import { Controller, Post, HttpCode, UseGuards } from '@nestjs/common';
import { AuthUser } from './decorator/auth-user.decorator';
import { UserDto } from 'src/modules/user/dto/user.dto';
import { LocalAuthGuard } from './guards/local-auth-guard';
import { JwtAuthGuard } from './guards/jwt-auth-guard';
import { AuthService } from './auth.service';
import { RoleEnum } from 'src/modules/role/enum/role.enum';
import { Roles } from 'src/modules/role/decorator/roles.decorator';
import { RoleGuard } from 'src/modules/role/guards/role.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @UseGuards(LocalAuthGuard)
    @Post('login')
    @HttpCode(200)
    signIn(@AuthUser() user : UserDto) {
        return this.authService.signIn(user);
    }
    
    @Post('protected')
    @UseGuards(RoleGuard)
    @Roles(RoleEnum.User)
    @UseGuards(JwtAuthGuard)
    protectedByRole(@AuthUser() user : UserDto) {
        return user;
    }
}

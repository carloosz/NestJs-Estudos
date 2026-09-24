import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/modules/user/users.service';
import { UserDto } from 'src/modules/user/dto/user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig } from 'src/config/jwt.config';
import type { ConfigType } from '@nestjs/config'

@Injectable()
export class AuthService {
   constructor(
      private userService: UserService,
      private jwtService: JwtService,
      @Inject(jwtConfig.KEY)
      private config: ConfigType<typeof jwtConfig>,
   ) {}

   async validateUserPassword(
      email: string,
      password: string,
   ): Promise<UserDto | null> {
      const user = await this.userService.validateUserPassword(email, password);
      return user;
   }

   async signIn(user: UserDto): Promise<AuthResponseDto> {
      const accessConfig = this.config.access;
      const refreshConfig = this.config.refresh;

      const payload: JwtPayload = { sub: user.id };

      const accessToken = await this.jwtService.sign(payload, {
         ...accessConfig.signOptions,
         secret: accessConfig.secret as string,
      });

      const refreshToken = await this.jwtService.sign(payload, {
         ...refreshConfig.signOptions,
         secret: refreshConfig.secret as string,
      });

      return new AuthResponseDto(accessToken, refreshToken);
   }

   async refresh(refreshToken: string): Promise<AuthResponseDto> {
      const refreshConfig = this.config.refresh;
      const accessConfig = this.config.access;

      let payload: JwtPayload;

      try {
         payload = await this.jwtService.verifyAsync(refreshToken, {
            secret: refreshConfig?.secret as string,
         });
      } catch (e) {
         throw new UnauthorizedException('Refresh token inválido ou expirado');
      }

      const user = await this.userService.findOne(payload.sub);
      if (!user) {
         throw new UnauthorizedException('Usuário não encontrado');
      }

      const newPayload: JwtPayload = { sub: user.id };

      const accessToken = await this.jwtService.signAsync(newPayload, {
         secret: accessConfig?.secret as string,
         ...accessConfig?.signOptions,
      });

      const newRefreshToken = await this.jwtService.signAsync(newPayload, {
         secret: refreshConfig?.secret as string,
         ...refreshConfig?.signOptions,
      });

      return new AuthResponseDto(accessToken, newRefreshToken);
   }
}

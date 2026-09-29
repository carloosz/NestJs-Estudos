import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/modules/user/users.service';
import { UserDto } from 'src/modules/user/dto/user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig } from 'src/config/jwt.config';
import type { ConfigType } from '@nestjs/config'
import { LoggerService } from 'src/modules/logger/logger.service';
import { User } from 'src/modules/user/entities/user.entity';
import { SendEmailOptions } from '../email/interfaces/email-options.interface';
import { EmailService } from '../email/email.service';
import { AuthUpdatePasswordDto } from './dto/auth-update-password.dto';

@Injectable()
export class AuthService {
   constructor(
      private userService: UserService,
      private jwtService: JwtService,
      @Inject(jwtConfig.KEY)
      private config: ConfigType<typeof jwtConfig>,
      private loggerService: LoggerService,
      private emailService: EmailService,
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

   async forgotPassword(email: string): Promise<void> {
      const user = await this.updateResetTokenIfValid(email);

      if (!user) {
         return;
      }

      const resetPasswordTemplate = 'reset-password';

      const emailOptions: SendEmailOptions = {
         to: user.email,
         subject: 'Redefinir senha',
         template: resetPasswordTemplate,
         context: {
            tokenUrl: `${process.env.FRONTEND_URL}/reset-password/${user.resetToken}`,
            tokenExp:
               user.resetTokenExp instanceof Date
                  ? user.resetTokenExp.toUTCString()
                  : '',
         },
      };

      await this.emailService.send(emailOptions);

      return;
   }

   private async updateResetTokenIfValid(email: string): Promise<User | null> {
      const MINUTES_TO_EXPIRE_TOKEN = 3;
      // update user if it does exists and return it
      const user = await this.userService.updateResetTokenByEmail(
         email,
         MINUTES_TO_EXPIRE_TOKEN,
      );

      // if no user or no user email, fail silently
      if (!user || !user.email) {
         this.loggerService.debug('user with invalid token or with no email');
         return null;
      }

      return user;
   }

   /**
    * If token exists and is still valid, update password.
    */
   async updatePassword(
      token: string,
      authUpdatePasswordDto: AuthUpdatePasswordDto,
   ): Promise<void> {
      // call user service
      await this.userService.updatePassword(
         token,
         authUpdatePasswordDto.password,
      );
      // don't return anything
      return;
   }
}


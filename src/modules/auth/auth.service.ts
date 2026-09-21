import { Inject, Injectable } from '@nestjs/common';
import { UserService } from 'src/modules/user/users.service';
import { UserDto } from 'src/modules/user/dto/user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig } from 'src/config/jwt.config';
import type { ConfigType } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @Inject(jwtConfig.KEY) 
    private config: ConfigType<typeof jwtConfig>
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

    const payload: JwtPayload = { sub: user.id }

    const accessToken = await this.jwtService.sign(
      payload, 
      accessConfig?.signOptions
    );

    const refreshToken = await this.jwtService.sign(
      payload,
      refreshConfig?.signOptions
    );
    
    return new AuthResponseDto(accessToken, refreshToken);
  }
}

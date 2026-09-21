import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, Inject } from '@nestjs/common';
import { UserService } from 'src/modules/user/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { jwtConfig } from 'src/config/jwt.config';
import type { ConfigType } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @Inject(jwtConfig.KEY) 
        private config: ConfigType<typeof jwtConfig>,
        private userService: UserService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.secret,
        });
    }
    
    async validate(payload: JwtPayload) {
        const user = await this.userService.findOne(payload.sub);
        if (!user) return false;
        return user;
    }
}

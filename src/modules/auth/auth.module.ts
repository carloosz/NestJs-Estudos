import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthLocalStrategy } from './auth-local.strategy';
import { UserModule } from 'src/modules/user/users.module';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from '../email/email.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/user/entities/user.entity';

@Module({
   imports: [
      UserModule,
      PassportModule,
      JwtModule.register({}),
      EmailModule,
      TypeOrmModule.forFeature([User]),
   ],
   controllers: [AuthController],
   providers: [AuthService, AuthLocalStrategy, JwtStrategy],
})
export class AuthModule {}

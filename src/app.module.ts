import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserRepository } from './modules/user/users.repository';
import { UserModule } from './modules/user/users.module';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { ConfigModule } from '@nestjs/config';
import { typeormConfig } from './config/typeorm.config';
import { ConfigType } from '@nestjs/config/dist/types/config.type';
import { RoleModule } from './modules/role/role.module';
import { UserRoleModule } from './modules/user-role/user-role.module';
import { AuthModule } from './modules/auth/auth.module';
import { jwtConfig } from './config/jwt.config';
import { LoggerModule } from './modules/logger/logger.module';
import { ApiKeyMiddleware } from './modules/auth/middleware/api-key.middleware';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeormConfig, jwtConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [typeormConfig.KEY],
      useFactory: (config: ConfigType<typeof typeormConfig>) => config,
    }),
    UserModule,
    RoleModule,
    UserRoleModule,
    AuthModule,
    LoggerModule,
    UploadModule
  ],
  controllers: [AppController],
  providers: [AppService, UserRepository],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(ApiKeyMiddleware)
    .exclude('*')
    .forRoutes({path: '*', method: RequestMethod.ALL});
  }
}

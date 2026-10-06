import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TmdbService } from './tmdb.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: 'https://api.themoviedb.org/3',
        timeout: 5000,
        headers: { Authorization: `Bearer ${config.get('TMDB_TOKEN')}` },
      }),
    }),
  ],
  providers: [TmdbService],
  exports: [TmdbService],
})
export class TmdbModule {}

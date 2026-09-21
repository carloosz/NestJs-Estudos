import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LoggerTransportService } from './logger-transport.service';
import { ConfigModule } from '@nestjs/config';
import { loggerConfig } from '../../config/logger.config';
import { loggerSentryConfig } from 'src/config/logger-sentry.config';
import { LoggerSentryTransport } from './transports/logger-sentry.transport';
import { LoggerRequestInterceptor } from './logger-request.interceptor';
import { LoggerExceptionFilter } from './logger-exception.filter';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(loggerConfig),
    ConfigModule.forFeature(loggerSentryConfig),
  ] ,
  controllers: [],
  providers: [
    LoggerService, 
    LoggerTransportService,
    LoggerSentryTransport,
    {
      provide: 'APP_INTERCEPTOR',
      useClass: LoggerRequestInterceptor,
    },
    {
      provide: 'APP_FILTER',
      useClass: LoggerExceptionFilter,
    }
  ],
  exports: [LoggerService]
})
export class LoggerModule {}

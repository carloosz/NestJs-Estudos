import { LogLevel } from '@nestjs/common';
import { SeverityLevel } from '@sentry/core';

export interface LoggerSentryConfigInterface {
  dsn: string;
  logLevelMap: (logLevel: LogLevel) => SeverityLevel;
}
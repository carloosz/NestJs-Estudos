import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@Controller()
export class AppController {
   constructor(private readonly appService: AppService) {}

   @Get()
   getHello(): string {
      return this.appService.getHello();
   }

   @ApiExcludeEndpoint()
   @SkipThrottle()
   @Get('health')
   health() {
      return { status: 'ok' };
   }
}

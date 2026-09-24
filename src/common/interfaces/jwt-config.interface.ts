import { JwtModuleOptions } from '@nestjs/jwt';

export interface JwtConfigInterface {
   access: JwtModuleOptions;
   refresh: JwtModuleOptions;
}

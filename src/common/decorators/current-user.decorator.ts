import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDto } from 'src/modules/user/dto/user.dto';

export const CurrentUser = createParamDecorator(
   (data: keyof UserDto | undefined, ctx: ExecutionContext) => {
      const user = ctx.switchToHttp().getRequest().user;
      return data ? user?.[data] : user;
   },
);

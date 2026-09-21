import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_KEYS } from '../decorator/roles.decorator';
import { RoleEnum } from '../enum/role.enum';
import { Observable } from 'rxjs';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(ROLE_KEYS, [
            context.getHandler(),
            context.getClass(),
        ]);
        
        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user) {
            throw new BadRequestException('Usuário não encontrado');
        }
        return requiredRoles.some((role) => user.roles.includes(role));
    }
}
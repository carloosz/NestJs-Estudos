import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from '../enum/role.enum';

export const ROLE_KEYS = 'roles';
export const Roles = (...roles: RoleEnum[]) => SetMetadata(ROLE_KEYS, roles);
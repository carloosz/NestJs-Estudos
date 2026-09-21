import { UserUpdatableInterface } from '../interfaces/index';
import { UserDto } from './user.dto';
import { PickType } from '@nestjs/swagger';

export class UpdateUserDto
  extends PickType(UserDto, ['firstName', 'lastName', 'active'])
  implements UserUpdatableInterface {}

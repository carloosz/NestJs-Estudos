import { UserCreatableInterface } from '../interfaces/index';
import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class CreateUserDto
  extends PickType(UserDto, ['username', 'firstName', 'lastName', 'email'])
  implements UserCreatableInterface
{
  @ApiProperty({
    description: 'The password of the user',
    example: '12345678',
  })
  @IsNotEmpty({ message: 'O password deve ser informado' })
  @IsString({ message: 'O password deve ser uma string' })
  @MinLength(8, { message: 'O password deve ter no mínimo 8 caracteres' })
  password!: string;

  @ApiProperty({
    description: 'The roles of the user',
    example: ['admin', 'user'],
  })
  @IsNotEmpty({ message: 'O roles deve ser informado' })
  @IsString({ each: true, message: 'O roles deve ser um array de strings' })
  roles: string[] = [];
}

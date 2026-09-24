import { UserRole } from 'src/modules/user-role/entities/user-role.entity';
import { UserInterface } from '../interfaces/user.interface';
import { Exclude, Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Upload } from 'src/modules/upload/entities/upload.entity';

@Exclude()
export class UserDto implements UserInterface {
  @Expose()
  id!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Expose()
  @ApiProperty({
    description: 'The username of the user',
    example: 'johndoe',
  })
  @IsNotEmpty({ message: 'O username deve ser informado' })
  @IsString({ message: 'O username deve ser uma string' })
  username!: string;

  password!: string;

  salt!: string;

  @Expose()
  @ApiProperty({
    description: 'The first name of the user',
    example: 'John',
  })
  @IsNotEmpty({ message: 'O firstName deve ser informado' })
  @IsString({ message: 'O firstName deve ser uma string' })
  firstName!: string;

  @Expose()
  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
  })
  @IsNotEmpty({ message: 'O lastName deve ser informado' })
  @IsString({ message: 'O lastName deve ser uma string' })
  lastName!: string;

  @Expose()
  @ApiProperty({
    description: 'The email of the user',
    example: 'HsCt6@example.com',
  })
  @IsNotEmpty({ message: 'O email deve ser informado' })
  @IsEmail({}, { message: 'O email deve ser um email valido' })
  @IsString({ message: 'O email deve ser uma string' })
  email!: string;

  @Expose()
  active!: boolean;

  @Expose()
  confirmed!: boolean;

  @Expose()
  @Transform(({ obj }) =>
    obj.userRoles.map((userRole: UserRole) => userRole.role.name),
  )
  roles: string[] = [];

  @Expose()
  uploads: Upload[] = [];
}

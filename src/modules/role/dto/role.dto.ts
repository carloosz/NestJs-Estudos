import { RoleInterface } from '../interfaces/role.interface';
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CommonEntityDto } from 'src/common/dto/common-entity.dto';

@Exclude()
export class RoleDto extends CommonEntityDto implements RoleInterface {
    @ApiProperty({ description: 'The name of the role' })
    @IsString()
    @Expose()
    name!: string;
}
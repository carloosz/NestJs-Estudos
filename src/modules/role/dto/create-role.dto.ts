import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateRoleDto {
    @ApiProperty({ description: 'The name of the role' })
    @IsString()
    @IsNotEmpty()
    name!: string;
}

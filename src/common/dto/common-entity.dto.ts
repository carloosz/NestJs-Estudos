import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class CommonEntityDto {
    @ApiProperty({ description: 'The unique identifier of the entity' })
    @Expose()
    id!: string;

    @ApiProperty({ description: 'The date and time when the resource was created' })
    @Expose()
    createdAt!: Date;

    @Expose()
    @ApiProperty({ description: 'The date and time when the resource was last updated' })
    updatedAt!: Date;
}
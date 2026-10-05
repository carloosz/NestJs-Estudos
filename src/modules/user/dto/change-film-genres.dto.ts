import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ChangeFilmGenresDto {
   @ApiProperty({
      description: 'The favorite film genres of the user',
      example: 'Ação, Comédia, Drama',
   })
   @IsString({ message: 'O film genres deve ser uma string' })
   filmGenres!: string;
}

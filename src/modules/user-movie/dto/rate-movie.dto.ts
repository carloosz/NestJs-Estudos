import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { Transform } from "class-transformer";

export class RateMovieDto {
  @IsOptional()
  @IsInt({ message: 'O rating deve ser um número inteiro' })
  @Min(1, { message: 'O rating deve ser no mínimo 1' })
  @Max(5, { message: 'O rating deve ser no máximo 5' })
  rating?: number | null;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'O review deve ser uma string' })
  @MaxLength(300, { message: 'O review deve ter no máximo 300 caracteres' })
  review?: string | null;
}

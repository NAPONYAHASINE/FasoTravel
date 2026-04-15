import {
  IsString,
  IsInt,
  IsOptional,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 'trip-001' })
  @IsString()
  @MaxLength(50)
  tripId: string;

  @ApiProperty({ example: 'op-tsc' })
  @IsString()
  @MaxLength(50)
  operatorId: string;

  @ApiProperty({ example: 4, description: 'Rating 1-5' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Bon trajet' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: "Le bus était propre et à l'heure." })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    example: { comfort: 4, punctuality: 5, staff: 3 },
    description: 'Aspect-level ratings',
  })
  @IsOptional()
  aspects?: Record<string, number>;
}

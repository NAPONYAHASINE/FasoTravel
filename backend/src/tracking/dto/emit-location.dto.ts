import {
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmitLocationDto {
  @ApiProperty({ example: 'user-001' })
  @IsString()
  @MaxLength(50)
  userId: string;

  @ApiProperty({ example: 'TKT-001' })
  @IsString()
  @MaxLength(50)
  ticketId: string;

  @ApiProperty({ example: 12.3656 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: -1.5197 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ example: 180 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;
}

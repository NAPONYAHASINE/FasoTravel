import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShareLocationDto {
  @ApiProperty({ example: 'trip-001' })
  @IsString()
  @MaxLength(50)
  tripId: string;

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

  @ApiPropertyOptional({ example: '2026-04-06T14:35:00.000Z' })
  @IsOptional()
  @IsString()
  timestamp?: string;
}

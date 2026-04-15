import {
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIncidentDto {
  @ApiProperty({ example: 'trip-001' })
  @IsString()
  @MaxLength(50)
  trip_id: string;

  @ApiProperty({ example: 'Accident sur la route' })
  @IsString()
  @MaxLength(1000)
  description: string;

  @ApiPropertyOptional({ example: 12.3656 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: -1.5197 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: '2026-04-06T14:35:00.000Z' })
  @IsOptional()
  @IsString()
  timestamp?: string;

  @ApiPropertyOptional({
    example: 'accident',
    enum: ['accident', 'delay', 'cancellation', 'mechanical', 'other'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['accident', 'delay', 'cancellation', 'mechanical', 'other'])
  type?: string;

  @ApiPropertyOptional({
    example: 'medium',
    enum: ['low', 'medium', 'high', 'critical'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high', 'critical'])
  severity?: string;
}

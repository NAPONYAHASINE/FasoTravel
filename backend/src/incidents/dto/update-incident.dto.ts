import {
  IsString,
  IsOptional,
  MaxLength,
  IsIn,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIncidentDto {
  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    example: 'accident',
    enum: ['accident', 'delay', 'cancellation', 'mechanical', 'other'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['accident', 'delay', 'cancellation', 'mechanical', 'other'])
  type?: string;

  @ApiPropertyOptional({
    example: 'high',
    enum: ['low', 'medium', 'high', 'critical'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high', 'critical'])
  severity?: string;

  @ApiPropertyOptional({
    example: 'in-progress',
    enum: ['open', 'in-progress', 'resolved'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['open', 'in-progress', 'resolved'])
  status?: string;

  @ApiPropertyOptional({ example: 42 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999)
  passengersAffected?: number;
}

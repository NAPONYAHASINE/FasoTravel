import {
  IsString,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchTripsDto {
  @ApiProperty({
    description: 'Departure city or station ID',
    example: 'Ouagadougou',
  })
  @IsString()
  from: string;

  @ApiProperty({
    description: 'Arrival city or station ID',
    example: 'Bobo-Dioulasso',
  })
  @IsString()
  to: string;

  @ApiProperty({
    description: 'Travel date (YYYY-MM-DD)',
    example: '2026-04-10',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Number of passengers', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  passengers: number = 1;
}

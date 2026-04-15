import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTripDto {
  @ApiProperty({ example: 'trip-ouaga-bobo-001' })
  @IsString()
  @MaxLength(50)
  id: string;

  @ApiProperty({ example: 'op-tsc' })
  @IsString()
  @MaxLength(50)
  operatorId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  operatorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  operatorLogo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  vehicleType?: string;

  @ApiProperty({ example: '2026-04-10T06:00:00Z' })
  @IsDateString()
  departureTime: string;

  @ApiProperty({ example: '2026-04-10T10:00:00Z' })
  @IsDateString()
  arrivalTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @ApiProperty({ example: 5000 })
  @IsInt()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({ default: 'XOF' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ default: 'standard' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  serviceClass?: string;

  @ApiProperty({ example: 'sta-ouaga-01' })
  @IsString()
  @MaxLength(50)
  fromStationId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fromStationName?: string;

  @ApiProperty({ example: 'sta-bobo-01' })
  @IsString()
  @MaxLength(50)
  toStationId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  toStationName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  routeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  busNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  gareId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  gareName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  driverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  driverName?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasLiveTracking?: boolean;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(0)
  totalSeats: number;
}

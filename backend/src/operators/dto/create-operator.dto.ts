import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOperatorDto {
  @ApiProperty({ example: 'op-tsc', description: 'Unique operator ID' })
  @IsString()
  @MaxLength(50)
  id: string;

  @ApiProperty({ example: 'Transport TSC' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: '🚌' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  operatorLogo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '+22670123456' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  websiteUrl?: string;

  @ApiPropertyOptional({ example: 2005 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  foundedYear?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  @Min(0)
  fleetSize?: number;

  @ApiPropertyOptional({ example: ['wifi', 'usb', 'ac'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  openingHours?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  primaryStationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  primaryStationName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  primaryStationCity?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  baggagePrice?: number;
}

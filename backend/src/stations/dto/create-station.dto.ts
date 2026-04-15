import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStationDto {
  @ApiProperty({ description: 'Unique station ID', example: 'sta-ouaga-01' })
  @IsString()
  @MaxLength(50)
  id: string;

  @ApiProperty({
    description: 'Station name',
    example: 'Gare Routière de Ouagadougou',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'City', example: 'Ouagadougou' })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiPropertyOptional({ description: 'Region' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Full address' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: 'Operator ID that owns this station' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  operatorId?: string;

  @ApiPropertyOptional({ description: 'Amenities list', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Opening hours', example: '06:00-22:00' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  openingHours?: string;

  @ApiPropertyOptional({ description: 'Contact phone' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Phone' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Contact person' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Capacity' })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional({ description: 'Status', default: 'active' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Manager ID' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  managerId?: string;

  @ApiPropertyOptional({ description: 'Manager name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  managerName?: string;

  @ApiPropertyOptional({ description: 'Baggage price' })
  @IsOptional()
  @IsNumber()
  baggagePrice?: number;
}

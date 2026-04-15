import {
  IsString,
  IsArray,
  IsOptional,
  IsInt,
  Min,
  ArrayMinSize,
  ValidateNested,
  MaxLength,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PassengerInfoDto {
  @ApiProperty({ example: 'Amadou Ouédraogo' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: '+22670123456' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'amadou@email.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;
}

export class CreateBookingDto {
  @ApiProperty({ description: 'Trip ID', example: 'trip-ouaga-bobo-001' })
  @IsString()
  @MaxLength(50)
  tripId: string;

  @ApiPropertyOptional({
    description: 'Seat numbers to book (when user picks specific seats)',
    example: ['1A', '1B'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  seatNumbers?: string[];

  @ApiPropertyOptional({
    description: 'Number of seats (auto-assign when seatNumbers not provided)',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  numSeats?: number;

  @ApiPropertyOptional({ description: 'Unit price per seat (from mobile)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'Selected optional services' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedServices?: string[];

  @ApiPropertyOptional({ description: 'Passenger name (mobile shortcut)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  passengerName?: string;

  @ApiPropertyOptional({ description: 'Passenger phone (mobile shortcut)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  passengerPhone?: string;

  @ApiPropertyOptional({
    description: 'Boarding station ID (for multi-segment)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  boardingStationId?: string;

  @ApiPropertyOptional({
    description: 'Alighting station ID (for multi-segment)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  alightingStationId?: string;

  @ApiPropertyOptional({
    description: 'Passenger info for each seat',
    type: [PassengerInfoDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassengerInfoDto)
  passengers?: PassengerInfoDto[];
}

import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class StationFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by city name' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Search by name or address' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by operator ID' })
  @IsOptional()
  @IsString()
  operatorId?: string;
}

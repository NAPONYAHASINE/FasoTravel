import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class AuditLogQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['admin', 'operator', 'passenger', 'system', 'all'])
  source?: string;

  @IsOptional()
  @IsString()
  @IsIn(['info', 'warning', 'critical', 'all'])
  severity?: string;

  @IsOptional()
  @IsString()
  @IsIn(['security', 'operations', 'finance', 'content', 'config', 'all'])
  category?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['all', '24h', '7d', '30d', '90d'])
  dateRange?: string;
}

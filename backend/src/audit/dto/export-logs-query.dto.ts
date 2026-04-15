import { IsOptional, IsString, IsIn } from 'class-validator';

export class ExportLogsQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['csv', 'json'])
  format?: string;

  @IsOptional()
  @IsString()
  @IsIn(['all', '24h', '7d', '30d', '90d'])
  dateRange?: string;
}

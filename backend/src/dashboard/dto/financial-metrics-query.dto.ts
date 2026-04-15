import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class FinancialMetricsQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['today', 'week', 'month', 'year', 'custom'])
  period?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDetails?: boolean;
}

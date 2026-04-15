import { IsOptional, IsString, IsIn } from 'class-validator';

export class DashboardStatsQueryDto {
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
}

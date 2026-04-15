import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class OperatorPolicyQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(['platform', 'company'])
  source?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsIn(['compliant', 'review_needed', 'non_compliant'])
  compliance?: string;
}

export class CreateOperatorPolicyDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  rules?: Record<string, any>;

  @IsOptional()
  @IsIn(['platform', 'company'])
  source?: string;

  @IsOptional()
  @IsString()
  effectiveFrom?: string;
}

export class UpdateComplianceDto {
  @IsIn(['compliant', 'review_needed', 'non_compliant'])
  complianceStatus: string;

  @IsOptional()
  @IsString()
  complianceNote?: string;
}

// Platform policies
export class PlatformPolicyQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: string;

  @IsOptional()
  @IsIn(['privacy', 'terms', 'platform_rule'])
  type?: string;

  @IsOptional()
  @IsIn(['global', 'company_addon'])
  scope?: string;
}

export class CreatePlatformPolicyDto {
  @IsIn(['privacy', 'terms', 'platform_rule'])
  type: string;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsIn(['global', 'company_addon'])
  scope?: string;
}

export class UpdatePlatformPolicyDto {
  @IsOptional()
  @IsIn(['privacy', 'terms', 'platform_rule'])
  type?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsIn(['global', 'company_addon'])
  scope?: string;
}

import { IsOptional, IsString, IsIn, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class SessionQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['web', 'mobile', 'tablet'])
  deviceType?: string;

  @IsOptional()
  @IsString()
  @IsIn(['admin', 'operator', 'passenger'])
  userType?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  active?: boolean;
}

import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CancelCouponDto {
  @IsString()
  @MaxLength(500)
  reason: string;

  @IsOptional()
  @IsString()
  adminId?: string;
}

import { IsString, IsUUID } from 'class-validator';

export class UseCouponDto {
  @IsString()
  @IsUUID()
  couponId: string;
}

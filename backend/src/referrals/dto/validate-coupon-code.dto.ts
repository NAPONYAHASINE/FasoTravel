import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateCouponCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateReferralCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

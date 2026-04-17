import { IsOptional, IsString, IsEmail, IsBoolean, IsIn } from 'class-validator';

export class UpdatePassengerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @IsIn(['fr', 'en', 'mo'])
  preferredLanguage?: string;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;
}

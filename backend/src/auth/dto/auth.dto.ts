import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Mobile sends: { email, password, phone, firstName, lastName, referralCode? }
 * Societe sends: { email, password, name, role, companyId?, gareId?, gareName? }
 * Backend accepts the union of both.
 */
export class RegisterDto {
  @ApiProperty({ example: 'amadou@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecureP@ss1' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '+22670000000' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'Phone number must be valid' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Amadou' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Diallo' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Amadou Diallo' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'responsable' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: 'FTABC123' })
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiPropertyOptional({ example: 'company-001' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({ example: 'gare-001' })
  @IsOptional()
  @IsString()
  gareId?: string;

  @ApiPropertyOptional({ example: 'Gare Routière Ouagadougou' })
  @IsOptional()
  @IsString()
  gareName?: string;
}

/**
 * All 3 frontends send: { email, password }
 * Mobile phone users get a synthetic email: {phone}@phone.transportbf.bf
 */
export class LoginDto {
  @ApiProperty({ example: 'amadou@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecureP@ss1' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

/**
 * Mobile sends: { identifier, code, mode }
 * Admin sends:  { code, email }
 * Backend accepts the union.
 */
export class VerifyOtpDto {
  @ApiPropertyOptional({ example: 'amadou@email.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'amadou@email.com' })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  code: string;

  @ApiPropertyOptional({ example: 'login' })
  @IsOptional()
  @IsString()
  mode?: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: 'amadou@email.com' })
  @IsString()
  @IsNotEmpty()
  email: string;
}

export class RefreshTokenDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'amadou@email.com' })
  @IsString()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'amadou@email.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  code: string;

  @ApiProperty({ example: 'NewSecureP@ss1' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

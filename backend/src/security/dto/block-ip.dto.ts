import { IsString, IsOptional, IsIP } from 'class-validator';

export class BlockIpDto {
  @IsString()
  @IsIP()
  ip: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

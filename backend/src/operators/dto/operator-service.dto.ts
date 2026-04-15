import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateOperatorServiceDto {
  @IsString() operatorId: string;
  @IsString() serviceName: string;
  @IsOptional() @IsString() serviceType?: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() price: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateOperatorServiceDto {
  @IsOptional() @IsString() serviceName?: string;
  @IsOptional() @IsString() serviceType?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

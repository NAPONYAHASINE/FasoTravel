import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
} from 'class-validator';

export class CreateStoryCircleDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() iconUrl?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateStoryCircleDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() iconUrl?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateFeatureFlagDto {
  @IsString() key: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isEnabled?: boolean;
  @IsOptional() @IsObject() conditions?: Record<string, unknown>;
  @IsOptional() @IsString() category?: string;
}

export class UpdateFeatureFlagDto {
  @IsOptional() @IsString() key?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isEnabled?: boolean;
  @IsOptional() @IsObject() conditions?: Record<string, unknown>;
  @IsOptional() @IsString() category?: string;
}

import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateStoryDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  mediaType: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  gradient?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsString()
  ctaText?: string;

  @IsOptional()
  @IsString()
  ctaLink?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  durationSeconds?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsString()
  type: string;
}

export class UpdateStoryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  durationSeconds?: number;

  @IsOptional()
  @IsString()
  ctaText?: string;

  @IsOptional()
  @IsString()
  ctaLink?: string;
}

export class MarkViewedDto {
  @IsString()
  storyId: string;
}

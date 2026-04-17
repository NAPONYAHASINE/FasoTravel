import { IsString, IsOptional } from 'class-validator';

export class TrackImpressionDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;
}

export class TrackClickDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  actionType?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;
}

export class TrackConversionDto {
  @IsOptional()
  @IsString()
  conversionType?: string;

  @IsOptional()
  bookingId?: string;

  @IsOptional()
  revenueFcfa?: number;
}

export class CreateAdDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  mediaType!: string;

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
  actionType?: string;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsString()
  internalPage?: string;

  @IsOptional()
  internalData?: Record<string, any>;

  @IsOptional()
  targetPages?: string[];

  @IsOptional()
  targetNewUsers?: boolean;

  @IsOptional()
  priority?: number;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;
}

export class UpdateAdDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  mediaType?: string;

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
  actionType?: string;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsString()
  internalPage?: string;

  @IsOptional()
  internalData?: Record<string, any>;

  @IsOptional()
  targetPages?: string[];

  @IsOptional()
  targetNewUsers?: boolean;

  @IsOptional()
  priority?: number;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;

  @IsOptional()
  isActive?: boolean;
}

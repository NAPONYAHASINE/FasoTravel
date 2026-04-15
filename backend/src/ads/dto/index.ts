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

  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsOptional()
  @IsString()
  advertiser?: string;

  @IsOptional()
  targetPages?: string[];

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;

  @IsOptional()
  priority?: number;

  @IsOptional()
  targetNewUsers?: boolean;
}

export class UpdateAdDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsOptional()
  @IsString()
  advertiser?: string;

  @IsOptional()
  targetPages?: string[];

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;

  @IsOptional()
  priority?: number;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  targetNewUsers?: boolean;
}

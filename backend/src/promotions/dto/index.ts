import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  operatorId: string;

  @IsOptional()
  @IsString()
  operatorName?: string;

  @IsOptional()
  @IsString()
  tripId?: string;

  @IsOptional()
  @IsString()
  tripRoute?: string;

  @IsString()
  discountType: string; // 'percentage' | 'fixed'

  @IsNumber()
  discountValue: number;

  @IsOptional()
  @IsNumber()
  minPurchaseAmount?: number;

  @IsOptional()
  @IsNumber()
  maxDiscountAmount?: number;

  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @IsOptional()
  @IsNumber()
  usageLimitPerUser?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  // Story integration
  @IsOptional()
  @IsBoolean()
  storyEnabled?: boolean;

  @IsOptional()
  @IsString()
  storyMediaType?: string;

  @IsOptional()
  @IsString()
  storyMediaUrl?: string;

  @IsOptional()
  @IsString()
  storyThumbnailUrl?: string;

  @IsOptional()
  @IsString()
  storyCtaText?: string;

  @IsOptional()
  @IsString()
  storyCtaLink?: string;
}

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  discountType?: string;

  @IsOptional()
  @IsNumber()
  discountValue?: number;

  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ValidatePromotionDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  tripId?: string;
}

export class RejectPromotionDto {
  @IsString()
  reason: string;
}

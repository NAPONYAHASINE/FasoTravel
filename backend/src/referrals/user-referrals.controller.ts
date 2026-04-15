import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import {
  ConvertPointsDto,
  ValidateReferralCodeDto,
  ValidateCouponCodeDto,
  UseCouponDto,
} from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Referrals')
@Controller('referrals')
export class UserReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  /**
   * GET /referrals/me
   * Get current user's referral info (code, points, badge, referred users, shareLink).
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my referral info' })
  getMyReferralInfo(@CurrentUser('sub') userId: string) {
    return this.referralsService.getMyReferralInfo(userId);
  }

  /**
   * POST /referrals/convert
   * Convert referral points into a discount coupon.
   */
  @Post('convert')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert points to coupon' })
  convertPointsToCoupon(
    @CurrentUser('sub') userId: string,
    @Body() dto: ConvertPointsDto,
  ) {
    return this.referralsService.convertPointsToCoupon(userId, dto.pointsCost);
  }

  /**
   * GET /referrals/coupons
   * Get current user's referral coupons.
   */
  @Get('coupons')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my referral coupons' })
  getMyCoupons(@CurrentUser('sub') userId: string) {
    return this.referralsService.getMyCoupons(userId);
  }

  /**
   * POST /referrals/validate
   * Validate a referral code (used at registration to check if code is valid).
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Validate a referral code' })
  validateReferralCode(@Body() dto: ValidateReferralCodeDto) {
    return this.referralsService.validateReferralCode(dto.code);
  }

  /**
   * POST /referrals/coupons/validate
   * Validate a coupon code (used at payment to check if coupon is active).
   */
  @Post('coupons/validate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate a coupon code' })
  validateCouponCode(@Body() dto: ValidateCouponCodeDto) {
    return this.referralsService.validateCouponCode(dto.code);
  }

  /**
   * POST /referrals/coupons/use
   * Mark a coupon as used after successful payment.
   */
  @Post('coupons/use')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Use a coupon' })
  useCoupon(@CurrentUser('sub') userId: string, @Body() dto: UseCouponDto) {
    return this.referralsService.useCoupon(dto.couponId, userId);
  }
}

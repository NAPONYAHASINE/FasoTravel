import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { CancelCouponDto } from './dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';

@Controller('admin/referrals')
@Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  /**
   * GET /admin/referrals
   * List all referral users (users who have referred at least 1 person).
   */
  @Get()
  async getReferrals(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.referralsService.getReferralUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * GET /admin/referrals/stats
   * Global referral stats.
   */
  @Get('stats')
  async getStats() {
    return this.referralsService.getReferralStats();
  }

  /**
   * GET /admin/referrals/config
   * Current referral config (points, tiers, badge thresholds).
   */
  @Get('config')
  getConfig() {
    return this.referralsService.getReferralConfig();
  }

  /**
   * POST /admin/referrals/config
   * Update referral config (placeholder for now).
   */
  @Post('config')
  updateConfig(@Body() body: Record<string, unknown>) {
    return this.referralsService.updateReferralConfig(body);
  }

  /**
   * GET /admin/referrals/:id
   * Get a single referral user's detail.
   */
  @Get(':id')
  async getReferralById(@Param('id') id: string) {
    return this.referralsService.getReferralUserById(id);
  }

  /**
   * GET /admin/referrals/coupons?page=&limit=&status=
   * List all referral coupons with optional filters.
   */
  @Get('coupons')
  async getCoupons(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.referralsService.getCoupons(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status,
    );
  }

  /**
   * GET /admin/referrals/coupons/:id
   * Get a single coupon by ID.
   */
  @Get('coupons/:id')
  async getCouponById(@Param('id') id: string) {
    return this.referralsService.getCouponById(id);
  }

  /**
   * POST /admin/referrals/coupons/:id/cancel
   * Cancel a referral coupon (admin only).
   */
  @Post('coupons/:id/cancel')
  async cancelCoupon(
    @Param('id') couponId: string,
    @Body() dto: CancelCouponDto,
    @Req() req: { user?: { id?: string } },
  ) {
    // Inject admin ID from JWT if available
    if (req.user?.id && !dto.adminId) {
      dto.adminId = req.user.id;
    }
    return this.referralsService.cancelCoupon(couponId, dto);
  }

  /**
   * GET /admin/referrals/user/:userId
   * Get all coupons for a specific user.
   */
  @Get('user/:userId')
  async getUserCoupons(@Param('userId') userId: string) {
    return this.referralsService.getCouponsByUser(userId);
  }
}

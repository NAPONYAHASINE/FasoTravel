import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReferralCoupon, User } from '../database/entities';
import {
  CouponStatus,
  ReferralBadgeLevel,
  REFERRAL_BADGE_THRESHOLDS,
  REFERRAL_COUPON_TIERS,
  COUPON_VALIDITY_DAYS,
} from '../common/constants';
import { CancelCouponDto } from './dto';
import { MoreThan } from 'typeorm';
import { generateAlphanumericCode } from '../common/utils/code-generator';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(ReferralCoupon)
    private readonly couponRepo: Repository<ReferralCoupon>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * List all referral coupons with optional status filter.
   */
  async getCoupons(
    page = 1,
    limit = 20,
    status?: string,
  ): Promise<{
    data: ReferralCoupon[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const where: Record<string, string> = {};
    if (status) {
      where.status = status;
    }

    const [data, total] = await this.couponRepo.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single coupon by ID.
   */
  async getCouponById(id: string): Promise<ReferralCoupon> {
    const coupon = await this.couponRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!coupon) {
      throw new NotFoundException(`Coupon ${id} introuvable`);
    }
    return coupon;
  }

  /**
   * Admin cancels a referral coupon.
   * Only active coupons can be cancelled.
   */
  async cancelCoupon(
    couponId: string,
    dto: CancelCouponDto,
  ): Promise<ReferralCoupon> {
    const coupon = await this.couponRepo.findOne({
      where: { id: couponId },
      relations: ['user'],
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon ${couponId} introuvable`);
    }

    if (coupon.status !== CouponStatus.ACTIVE) {
      throw new BadRequestException(
        `Impossible d'annuler un coupon avec le statut "${coupon.status}". Seuls les coupons actifs peuvent etre annules.`,
      );
    }

    coupon.status = CouponStatus.CANCELLED;
    coupon.cancelledAt = new Date();
    coupon.cancelledBy = dto.adminId ?? null;
    coupon.cancelReason = dto.reason;

    return this.couponRepo.save(coupon);
  }

  /**
   * Get referral coupons for a specific user.
   */
  async getCouponsByUser(userId: string): Promise<ReferralCoupon[]> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Utilisateur ${userId} introuvable`);
    }

    return this.couponRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // ============================================
  // USER-FACING METHODS
  // ============================================

  /**
   * GET /referrals/me — User's referral info (code, points, badge, referred users).
   */
  async getMyReferralInfo(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Utilisateur ${userId} introuvable`);
    }

    // Referred users: those with referredBy === userId
    const referredUsers = await this.userRepo.find({
      where: { referredBy: userId },
      order: { createdAt: 'DESC' },
    });

    const badgeLevel = this.computeBadge(user.totalReferrals);

    return {
      referralCode: user.referralCode,
      pointsBalance: user.referralPointsBalance,
      totalReferrals: user.totalReferrals,
      badgeLevel,
      referredUsers: referredUsers.map((r) => ({
        id: r.id,
        name:
          [r.firstName, r.lastName].filter(Boolean).join(' ') ||
          r.name ||
          'Utilisateur',
        joinedAt: r.createdAt.toISOString(),
        pointsEarned:
          REFERRAL_BADGE_THRESHOLDS[ReferralBadgeLevel.STANDARD] === 0
            ? 10
            : 10,
      })),
      shareLink: `${this.configService.get<string>('APP_BASE_URL', 'https://fasotravel.bf')}/invite?code=${user.referralCode}`,
    };
  }

  /**
   * POST /referrals/convert — Convert points into a coupon.
   */
  async convertPointsToCoupon(userId: string, pointsCost: number) {
    const tier = REFERRAL_COUPON_TIERS.find((t) => t.pointsCost === pointsCost);
    if (!tier) {
      throw new BadRequestException('Tier de conversion invalide');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Utilisateur ${userId} introuvable`);
    }

    if (user.referralPointsBalance < pointsCost) {
      throw new BadRequestException('Points insuffisants');
    }

    // Deduct points
    user.referralPointsBalance -= pointsCost;
    await this.userRepo.save(user);

    // Create coupon
    const code = this.generateCouponCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + COUPON_VALIDITY_DAYS);

    const coupon = this.couponRepo.create({
      userId,
      code,
      amount: tier.amount,
      pointsCost: tier.pointsCost,
      status: CouponStatus.ACTIVE,
      expiresAt,
    });

    return this.couponRepo.save(coupon);
  }

  /**
   * GET /referrals/coupons — User's own coupons.
   */
  async getMyCoupons(userId: string): Promise<ReferralCoupon[]> {
    return this.couponRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * POST /referrals/validate — Validate a referral code (at registration).
   */
  async validateReferralCode(
    code: string,
  ): Promise<{ valid: boolean; referrerName?: string }> {
    const referrer = await this.userRepo.findOne({
      where: { referralCode: code },
    });
    if (!referrer) {
      return { valid: false };
    }
    const referrerName =
      [referrer.firstName, referrer.lastName].filter(Boolean).join(' ') ||
      referrer.name ||
      'Utilisateur FasoTravel';
    return { valid: true, referrerName };
  }

  /**
   * POST /referrals/coupons/validate — Validate a coupon code (at payment).
   */
  async validateCouponCode(code: string): Promise<ReferralCoupon> {
    const normalized = code.toUpperCase().trim();
    const coupon = await this.couponRepo.findOne({
      where: { code: normalized },
    });
    if (!coupon) {
      throw new NotFoundException('Code coupon invalide');
    }
    if (coupon.status === CouponStatus.USED) {
      throw new BadRequestException('Ce coupon a deja ete utilise');
    }
    if (coupon.status === CouponStatus.EXPIRED) {
      throw new BadRequestException('Ce coupon a expire');
    }
    if (coupon.status === CouponStatus.CANCELLED) {
      throw new BadRequestException('Ce coupon a ete annule');
    }
    return coupon;
  }

  /**
   * POST /referrals/coupons/use — Mark a coupon as used after payment.
   */
  async useCoupon(couponId: string, userId: string): Promise<void> {
    const coupon = await this.couponRepo.findOne({ where: { id: couponId } });
    if (!coupon) {
      throw new NotFoundException(`Coupon ${couponId} introuvable`);
    }
    if (coupon.userId !== userId) {
      throw new ForbiddenException('Ce coupon ne vous appartient pas');
    }
    if (coupon.status !== CouponStatus.ACTIVE) {
      throw new BadRequestException(
        `Impossible d'utiliser un coupon avec le statut "${coupon.status}"`,
      );
    }
    coupon.status = CouponStatus.USED;
    coupon.usedAt = new Date();
    await this.couponRepo.save(coupon);
  }

  // ============================================
  // HELPERS
  // ============================================

  private computeBadge(totalReferrals: number): string {
    if (totalReferrals >= REFERRAL_BADGE_THRESHOLDS[ReferralBadgeLevel.LEGENDE])
      return ReferralBadgeLevel.LEGENDE;
    if (
      totalReferrals >=
      REFERRAL_BADGE_THRESHOLDS[ReferralBadgeLevel.SUPER_AMBASSADEUR]
    )
      return ReferralBadgeLevel.SUPER_AMBASSADEUR;
    if (
      totalReferrals >=
      REFERRAL_BADGE_THRESHOLDS[ReferralBadgeLevel.AMBASSADEUR]
    )
      return ReferralBadgeLevel.AMBASSADEUR;
    return ReferralBadgeLevel.STANDARD;
  }

  private generateCouponCode(): string {
    return generateAlphanumericCode(6, 'FASO-');
  }

  // ============================================
  // ADMIN LISTING / STATS / CONFIG
  // ============================================

  /**
   * GET /admin/referrals — List all users who have referrals.
   */
  async getReferralUsers(page = 1, limit = 20) {
    const [data, total] = await this.userRepo.findAndCount({
      where: { totalReferrals: MoreThan(0) },
      order: { totalReferrals: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: data.map((u) => ({
        id: u.id,
        name:
          [u.firstName, u.lastName].filter(Boolean).join(' ') ||
          u.name ||
          'Utilisateur',
        email: u.email,
        referralCode: u.referralCode,
        totalReferrals: u.totalReferrals,
        pointsBalance: u.referralPointsBalance,
        badge: this.computeBadge(u.totalReferrals),
        joinedAt: u.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * GET /admin/referrals/:id — Single referral user detail.
   */
  async getReferralUserById(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`Utilisateur ${userId} introuvable`);

    const referredUsers = await this.userRepo.find({
      where: { referredBy: userId },
      order: { createdAt: 'DESC' },
    });

    const coupons = await this.couponRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return {
      id: user.id,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name,
      email: user.email,
      referralCode: user.referralCode,
      totalReferrals: user.totalReferrals,
      pointsBalance: user.referralPointsBalance,
      badge: this.computeBadge(user.totalReferrals),
      referredUsers: referredUsers.map((r) => ({
        id: r.id,
        name: [r.firstName, r.lastName].filter(Boolean).join(' ') || r.name,
        joinedAt: r.createdAt,
      })),
      coupons,
    };
  }

  /**
   * GET /admin/referrals/stats — Global referral statistics.
   */
  async getReferralStats() {
    const totalReferrers = await this.userRepo.count({
      where: { totalReferrals: MoreThan(0) },
    });
    const totalCoupons = await this.couponRepo.count();
    const activeCoupons = await this.couponRepo.count({
      where: { status: CouponStatus.ACTIVE },
    });
    const usedCoupons = await this.couponRepo.count({
      where: { status: CouponStatus.USED },
    });

    const result: { total: string } | undefined = await this.userRepo
      .createQueryBuilder('u')
      .select('COALESCE(SUM(u.total_referrals), 0)', 'total')
      .getRawOne();

    return {
      totalReferrers,
      totalReferrals: Number(result?.total ?? 0),
      totalCoupons,
      activeCoupons,
      usedCoupons,
      conversionRate:
        totalCoupons > 0 ? Math.round((usedCoupons / totalCoupons) * 100) : 0,
    };
  }

  /**
   * GET /admin/referrals/config — Current referral config.
   */
  getReferralConfig() {
    return {
      badgeThresholds: REFERRAL_BADGE_THRESHOLDS,
      couponTiers: REFERRAL_COUPON_TIERS,
      couponValidityDays: COUPON_VALIDITY_DAYS,
    };
  }

  /**
   * POST /admin/referrals/config — Update config (placeholder).
   */
  updateReferralConfig(_body: Record<string, unknown>) {
    // In production, persist to a settings table
    return { message: 'Config update acknowledged (placeholder)' };
  }
}

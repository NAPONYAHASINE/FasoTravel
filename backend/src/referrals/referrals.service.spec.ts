import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { ReferralCoupon, User } from '../database/entities';
import { CouponStatus } from '../common/constants';

describe('ReferralsService', () => {
  let service: ReferralsService;
  let couponRepo: Record<string, jest.Mock>;
  let userRepo: Record<string, jest.Mock>;

  const mockCoupon: Partial<ReferralCoupon> = {
    id: 'coupon-001',
    userId: 'user-001',
    code: 'FTCOUP001',
    amount: 500,
    pointsCost: 50,
    status: CouponStatus.ACTIVE,
    expiresAt: new Date('2026-12-31'),
    usedAt: null,
    cancelledAt: null,
    cancelledBy: null,
    cancelReason: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    user: { id: 'user-001', firstName: 'Amadou', lastName: 'Diallo' } as User,
  };

  beforeEach(async () => {
    couponRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      find: jest.fn(),
      save: jest.fn((entity: Record<string, unknown>) =>
        Promise.resolve(entity),
      ),
      create: jest.fn((entity: Record<string, unknown>) => ({ ...entity })),
    };

    userRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn((entity: Record<string, unknown>) =>
        Promise.resolve(entity),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        { provide: getRepositoryToken(ReferralCoupon), useValue: couponRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('https://fasotravel.bf') },
        },
      ],
    }).compile();

    service = module.get<ReferralsService>(ReferralsService);
  });

  // --- getCoupons ---
  describe('getCoupons', () => {
    it('should return paginated coupons', async () => {
      couponRepo.findAndCount.mockResolvedValue([[mockCoupon], 1]);

      const result = await service.getCoupons(1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by status', async () => {
      couponRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getCoupons(1, 20, 'active');

      expect(couponRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active' },
        }),
      );
    });

    it('should handle empty results', async () => {
      couponRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getCoupons(1, 20);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  // --- getCouponById ---
  describe('getCouponById', () => {
    it('should return coupon when found', async () => {
      couponRepo.findOne.mockResolvedValue(mockCoupon);

      const result = await service.getCouponById('coupon-001');

      expect(result.id).toBe('coupon-001');
    });

    it('should throw NotFoundException when not found', async () => {
      couponRepo.findOne.mockResolvedValue(null);

      await expect(service.getCouponById('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --- cancelCoupon ---
  describe('cancelCoupon', () => {
    it('should cancel an active coupon', async () => {
      couponRepo.findOne.mockResolvedValue({ ...mockCoupon });

      const result = await service.cancelCoupon('coupon-001', {
        reason: 'Fraude detectee',
        adminId: 'admin-001',
      });

      expect(result.status).toBe(CouponStatus.CANCELLED);
      expect(result.cancelReason).toBe('Fraude detectee');
      expect(result.cancelledBy).toBe('admin-001');
      expect(result.cancelledAt).toBeInstanceOf(Date);
      expect(couponRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for unknown coupon', async () => {
      couponRepo.findOne.mockResolvedValue(null);

      await expect(
        service.cancelCoupon('nope', { reason: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject cancellation of used coupon', async () => {
      couponRepo.findOne.mockResolvedValue({
        ...mockCoupon,
        status: CouponStatus.USED,
      });

      await expect(
        service.cancelCoupon('coupon-001', { reason: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject cancellation of expired coupon', async () => {
      couponRepo.findOne.mockResolvedValue({
        ...mockCoupon,
        status: CouponStatus.EXPIRED,
      });

      await expect(
        service.cancelCoupon('coupon-001', { reason: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject cancellation of already cancelled coupon', async () => {
      couponRepo.findOne.mockResolvedValue({
        ...mockCoupon,
        status: CouponStatus.CANCELLED,
      });

      await expect(
        service.cancelCoupon('coupon-001', { reason: 'test again' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should work without adminId', async () => {
      couponRepo.findOne.mockResolvedValue({ ...mockCoupon });

      const result = await service.cancelCoupon('coupon-001', {
        reason: 'Raison inconnue',
      });

      expect(result.status).toBe(CouponStatus.CANCELLED);
      expect(result.cancelledBy).toBeNull();
    });
  });

  // --- getCouponsByUser ---
  describe('getCouponsByUser', () => {
    it('should return user coupons', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'user-001' });
      couponRepo.find.mockResolvedValue([mockCoupon]);

      const result = await service.getCouponsByUser('user-001');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-001');
    });

    it('should throw NotFoundException for unknown user', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getCouponsByUser('nope')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return empty array when user has no coupons', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'user-002' });
      couponRepo.find.mockResolvedValue([]);

      const result = await service.getCouponsByUser('user-002');

      expect(result).toHaveLength(0);
    });
  });

  // ─── USER-FACING METHODS ──────────────────────────────────

  describe('getMyReferralInfo', () => {
    it('should return user referral info', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'user-001',
        referralCode: 'FT-226-DEMO',
        referralPointsBalance: 150,
        totalReferrals: 5,
        firstName: 'Amadou',
        lastName: 'Diallo',
      });
      userRepo.find.mockResolvedValue([
        {
          id: 'ref-001',
          firstName: 'Aminata',
          lastName: 'Traore',
          createdAt: new Date(),
        },
      ]);

      const result = await service.getMyReferralInfo('user-001');
      expect(result.referralCode).toBe('FT-226-DEMO');
      expect(result.pointsBalance).toBe(150);
      expect(result.referredUsers).toHaveLength(1);
      expect(result.shareLink).toContain('FT-226-DEMO');
    });

    it('should throw NotFoundException for unknown user', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.getMyReferralInfo('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('convertPointsToCoupon', () => {
    it('should convert points to coupon (100 pts → 500 FCFA)', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'user-001',
        referralPointsBalance: 200,
      });

      const result = await service.convertPointsToCoupon('user-001', 100);
      expect(result.amount).toBe(500);
      expect(result.pointsCost).toBe(100);
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should reject invalid tier', async () => {
      await expect(
        service.convertPointsToCoupon('user-001', 999),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject insufficient points', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'user-001',
        referralPointsBalance: 50,
      });
      await expect(
        service.convertPointsToCoupon('user-001', 100),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for unknown user', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.convertPointsToCoupon('nope', 100)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getMyCoupons', () => {
    it('should return user coupons', async () => {
      couponRepo.find.mockResolvedValue([mockCoupon]);
      const result = await service.getMyCoupons('user-001');
      expect(result).toHaveLength(1);
    });
  });

  describe('validateReferralCode', () => {
    it('should validate existing code', async () => {
      userRepo.findOne.mockResolvedValue({
        referralCode: 'FT-226-ABCD',
        firstName: 'Amadou',
        lastName: 'Diallo',
      });
      const result = await service.validateReferralCode('FT-226-ABCD');
      expect(result.valid).toBe(true);
      expect(result.referrerName).toBe('Amadou Diallo');
    });

    it('should return invalid for unknown code', async () => {
      userRepo.findOne.mockResolvedValue(null);
      const result = await service.validateReferralCode('NOPE');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateCouponCode', () => {
    it('should validate active coupon', async () => {
      couponRepo.findOne.mockResolvedValue({ ...mockCoupon });
      const result = await service.validateCouponCode('FTCOUP001');
      expect(result.code).toBe('FTCOUP001');
    });

    it('should reject unknown coupon', async () => {
      couponRepo.findOne.mockResolvedValue(null);
      await expect(service.validateCouponCode('NOPE')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject used coupon', async () => {
      couponRepo.findOne.mockResolvedValue({
        ...mockCoupon,
        status: CouponStatus.USED,
      });
      await expect(service.validateCouponCode('FTCOUP001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject expired coupon', async () => {
      couponRepo.findOne.mockResolvedValue({
        ...mockCoupon,
        status: CouponStatus.EXPIRED,
      });
      await expect(service.validateCouponCode('FTCOUP001')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('useCoupon', () => {
    it('should mark coupon as used', async () => {
      couponRepo.findOne.mockResolvedValue({ ...mockCoupon });
      await service.useCoupon('coupon-001', 'user-001');
      expect(couponRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: CouponStatus.USED }),
      );
    });

    it('should throw NotFoundException for unknown coupon', async () => {
      couponRepo.findOne.mockResolvedValue(null);
      await expect(service.useCoupon('nope', 'user-001')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for wrong user', async () => {
      couponRepo.findOne.mockResolvedValue({
        ...mockCoupon,
        userId: 'other-user',
      });
      await expect(service.useCoupon('coupon-001', 'user-001')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject already used coupon', async () => {
      couponRepo.findOne.mockResolvedValue({
        ...mockCoupon,
        status: CouponStatus.USED,
      });
      await expect(service.useCoupon('coupon-001', 'user-001')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

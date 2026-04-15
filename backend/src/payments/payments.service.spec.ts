import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment, Booking } from '../database/entities';
import { BookingsService } from '../bookings/bookings.service';
import {
  PaymentStatus,
  BookingStatus,
  PaymentMethod,
} from '../common/constants';

const userId = 'user-uuid-123';

const mockBooking = {
  id: 'bk-uuid-1',
  userId,
  tripId: 'trip-001',
  operatorId: 'op-tsc',
  status: BookingStatus.PENDING,
  totalAmount: 10000,
  currency: 'XOF',
  numPassengers: 2,
  trip: { fromStationName: 'Ouagadougou' },
};

const mockPayment = {
  id: 'pay-uuid-1',
  bookingId: 'bk-uuid-1',
  userId,
  amount: 10000,
  currency: 'XOF',
  method: PaymentMethod.ORANGE_MONEY,
  status: PaymentStatus.PENDING,
  platformFee: 200,
  companyAmount: 9800,
  providerReference: 'ref-123',
  idempotencyKey: null as string | null,
  completedAt: null as Date | null,
  processedAt: null as Date | null,
  failedReason: null as string | null,
  refundReason: null as string | null,
  refundedAt: null as Date | null,
  providerMetadata: null,
};

const mockPaymentRepo = {
  findOne: jest.fn(),
  create: jest
    .fn()
    .mockImplementation((data) => ({ id: 'pay-uuid-1', ...data })),
  save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
  createQueryBuilder: jest.fn(),
};

const mockBookingRepo = {
  findOne: jest.fn(),
};

const mockBookingsService = {
  confirm: jest.fn().mockResolvedValue(undefined),
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
        { provide: BookingsService, useValue: mockBookingsService },
      ],
    }).compile();
    service = module.get(PaymentsService);
  });

  // ─── create ────────────────────────────────────────────────────
  describe('create', () => {
    const dto = {
      bookingId: 'bk-uuid-1',
      amount: 10000,
      method: PaymentMethod.ORANGE_MONEY,
    };

    it('should create a PENDING payment with platform fee', async () => {
      mockBookingRepo.findOne.mockResolvedValue({ ...mockBooking });
      mockPaymentRepo.findOne.mockResolvedValue(null); // no idempotency, no duplicate

      const result = await service.create(userId, dto);

      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.platformFee).toBe(200); // 2 passengers × 100
      expect(result.companyAmount).toBe(9800);
      expect(mockPaymentRepo.save).toHaveBeenCalled();
    });

    it('should return existing payment when idempotency key matches', async () => {
      const existing = { ...mockPayment, idempotencyKey: 'idem-key-1' };
      mockPaymentRepo.findOne.mockResolvedValueOnce(existing);

      const result = await service.create(userId, {
        ...dto,
        idempotencyKey: 'idem-key-1',
      });

      expect(result).toBe(existing);
      expect(mockPaymentRepo.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(null);
      mockBookingRepo.findOne.mockResolvedValue(null);

      await expect(service.create(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if booking not PENDING', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(null);
      mockBookingRepo.findOne.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      await expect(service.create(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if duplicate pending payment', async () => {
      mockPaymentRepo.findOne.mockResolvedValueOnce(mockPayment); // duplicate check
      mockBookingRepo.findOne.mockResolvedValue({ ...mockBooking });

      await expect(service.create(userId, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── findOne ───────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return payment', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      const result = await service.findOne('pay-uuid-1');
      expect(result.id).toBe('pay-uuid-1');
    });

    it('should throw NotFoundException', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getPaymentMethods ────────────────────────────────────────
  describe('getPaymentMethods', () => {
    it('should return 5 payment methods', () => {
      const methods = service.getPaymentMethods();
      expect(methods).toHaveLength(5);
      expect(methods.map((m) => m.id)).toEqual(
        expect.arrayContaining([
          PaymentMethod.ORANGE_MONEY,
          PaymentMethod.MOOV_MONEY,
          PaymentMethod.WAVE,
          PaymentMethod.CARD,
          PaymentMethod.CASH,
        ]),
      );
    });
  });

  // ─── processWebhook ──────────────────────────────────────────
  describe('processWebhook', () => {
    it('should complete payment and confirm booking', async () => {
      mockPaymentRepo.findOne.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PENDING,
      });

      const result = await service.processWebhook('ref-123', 'completed');

      expect(result.status).toBe(PaymentStatus.COMPLETED);
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(mockBookingsService.confirm).toHaveBeenCalledWith(
        'bk-uuid-1',
        userId,
      );
    });

    it('should mark payment as FAILED on non-completed status', async () => {
      mockPaymentRepo.findOne.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PENDING,
      });

      const result = await service.processWebhook('ref-123', 'declined');

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.failedReason).toBe('declined');
    });

    it('should return early if payment already processed (idempotent)', async () => {
      mockPaymentRepo.findOne.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      });

      const result = await service.processWebhook('ref-123', 'completed');

      expect(result.status).toBe(PaymentStatus.COMPLETED);
      expect(mockPaymentRepo.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if no payment for provider ref', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(null);
      await expect(
        service.processWebhook('unknown-ref', 'completed'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findAll (admin) ──────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated payments', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockPayment], 1]),
      };
      mockPaymentRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(
        { page: 1, limit: 20, skip: 0 },
        { status: 'completed' },
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(qb.andWhere).toHaveBeenCalled();
    });
  });

  // ─── getRevenueStats ─────────────────────────────────────────
  describe('getRevenueStats', () => {
    it('should return revenue statistics', async () => {
      const mockQb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };
      // totals
      mockQb.getRawOne
        .mockResolvedValueOnce({
          totalRevenue: '50000',
          platformCommission: '1000',
          companyRevenue: '49000',
          totalPayments: '10',
          successfulPayments: '8',
          failedPayments: '1',
          refundedPayments: '1',
        })
        .mockResolvedValueOnce({ revenue: '10000' }) // today
        .mockResolvedValueOnce({ revenue: '30000' }) // week
        .mockResolvedValueOnce({ revenue: '50000' }); // month

      mockPaymentRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getRevenueStats();

      expect(result.totalRevenue).toBe(50000);
      expect(result.platformCommission).toBe(1000);
      expect(result.todayRevenue).toBe(10000);
      expect(result.weekRevenue).toBe(30000);
      expect(result.monthRevenue).toBe(50000);
      expect(result.successfulPayments).toBe(8);
      expect(result.averageTicketPrice).toBe(6250); // 50000 / 8
    });
  });

  // ─── refund ───────────────────────────────────────────────────
  describe('refund', () => {
    it('should refund a completed payment', async () => {
      mockPaymentRepo.findOne.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      });

      const result = await service.refund('pay-uuid-1', 'Customer request');

      expect(result.status).toBe(PaymentStatus.REFUNDED);
      expect(result.refundReason).toBe('Customer request');
      expect(result.refundedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException if payment missing', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(null);
      await expect(service.refund('nope', 'reason')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if payment not completed', async () => {
      mockPaymentRepo.findOne.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PENDING,
      });

      await expect(service.refund('pay-uuid-1', 'reason')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── retry ────────────────────────────────────────────────────
  describe('retry', () => {
    it('should retry a failed payment', async () => {
      mockPaymentRepo.findOne.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.FAILED,
      });

      const result = await service.retry('pay-uuid-1');

      expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('should throw NotFoundException if payment missing', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(null);
      await expect(service.retry('nope')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payment not failed', async () => {
      mockPaymentRepo.findOne.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      });

      await expect(service.retry('pay-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

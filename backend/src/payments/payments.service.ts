import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, Booking } from '../database/entities';
import {
  PaymentStatus,
  BookingStatus,
  PaymentMethod,
} from '../common/constants';
import { CreatePaymentDto } from './dto';
import { BookingsService } from '../bookings/bookings.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';

/** Platform fee per passenger (100 FCFA) */
const PLATFORM_FEE_PER_PASSENGER = 100;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly bookingsService: BookingsService,
  ) {}

  // ─── Mobile: Initiate payment ──────────────────────────────────
  async create(userId: string, dto: CreatePaymentDto): Promise<Payment> {
    // Idempotency check
    if (dto.idempotencyKey) {
      const existing = await this.paymentRepo.findOne({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) {
        return existing;
      }
    }

    // Verify booking belongs to user and is PENDING
    const booking = await this.bookingRepo.findOne({
      where: { id: dto.bookingId, userId },
      relations: ['trip'],
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.status !== (BookingStatus.PENDING as string)) {
      throw new BadRequestException(
        `Booking is ${booking.status}, cannot initiate payment`,
      );
    }

    // Check no duplicate pending payment for this booking
    const pendingPayment = await this.paymentRepo.findOne({
      where: { bookingId: dto.bookingId, status: PaymentStatus.PENDING },
    });
    if (pendingPayment) {
      throw new ConflictException(
        'A pending payment already exists for this booking',
      );
    }

    // Calculate platform fee
    const platformFee = booking.numPassengers * PLATFORM_FEE_PER_PASSENGER;
    const companyAmount = dto.amount - platformFee;

    const payment = this.paymentRepo.create({
      bookingId: dto.bookingId,
      userId,
      companyId: booking.operatorId,
      amount: dto.amount,
      currency: dto.currency || 'XOF',
      method: dto.method,
      status: PaymentStatus.PENDING,
      platformFee,
      companyAmount: companyAmount > 0 ? companyAmount : 0,
      idempotencyKey: dto.idempotencyKey,
    });

    const saved = await this.paymentRepo.save(payment);
    this.logger.log(
      `Payment ${saved.id} created for booking ${dto.bookingId} (${dto.method})`,
    );
    return saved;
  }

  // ─── Mobile: Get payment detail ────────────────────────────────
  async findOne(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }
    return payment;
  }

  // ─── Mobile: Get payment methods ──────────────────────────────
  getPaymentMethods() {
    return [
      {
        id: PaymentMethod.ORANGE_MONEY,
        name: 'Orange Money',
        type: 'mobile_money',
        provider: 'orange',
        enabled: true,
        feesPercentage: 1,
      },
      {
        id: PaymentMethod.MOOV_MONEY,
        name: 'Moov Money',
        type: 'mobile_money',
        provider: 'moov',
        enabled: true,
        feesPercentage: 1,
      },
      {
        id: PaymentMethod.WAVE,
        name: 'Wave',
        type: 'mobile_money',
        provider: 'wave',
        enabled: true,
        feesPercentage: 0.5,
      },
      {
        id: PaymentMethod.CARD,
        name: 'Carte bancaire',
        type: 'card',
        provider: 'paydunya',
        enabled: false,
        feesPercentage: 2.5,
      },
      {
        id: PaymentMethod.CASH,
        name: 'Espèces',
        type: 'cash',
        provider: 'counter',
        enabled: true,
        feesPercentage: 0,
      },
    ];
  }

  // ─── Webhook: Process provider callback ────────────────────────
  async processWebhook(
    providerRef: string,
    providerStatus: string,
    metadata?: Record<string, any>,
  ): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { providerReference: providerRef },
    });
    if (!payment) {
      throw new NotFoundException(
        `No payment found for provider ref ${providerRef}`,
      );
    }

    // Idempotency: already processed
    if (payment.status !== PaymentStatus.PENDING) {
      this.logger.warn(
        `Webhook received for already-processed payment ${payment.id} (${payment.status})`,
      );
      return payment;
    }

    if (providerStatus === 'completed') {
      payment.status = PaymentStatus.COMPLETED;
      payment.completedAt = new Date();
      payment.processedAt = new Date();
      payment.providerMetadata = metadata ?? payment.providerMetadata;

      await this.paymentRepo.save(payment);

      // Confirm the booking → triggers ticket generation
      try {
        await this.bookingsService.confirm(payment.bookingId, payment.userId);
        this.logger.log(
          `Payment ${payment.id} completed → booking ${payment.bookingId} confirmed`,
        );
      } catch (err) {
        this.logger.error(
          `Payment ${payment.id} completed but booking confirm failed: ${(err as Error).message}`,
        );
      }
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.failedReason = providerStatus;
      payment.processedAt = new Date();
      payment.providerMetadata = metadata ?? payment.providerMetadata;
      await this.paymentRepo.save(payment);
      this.logger.warn(`Payment ${payment.id} failed: ${providerStatus}`);
    }

    return payment;
  }

  // ─── Admin: List all payments (paginated + filtered) ───────────
  async findAll(
    pagination: PaginationDto,
    filters?: { status?: string; method?: string; search?: string },
  ): Promise<PaginatedResponse<Payment>> {
    const qb = this.paymentRepo.createQueryBuilder('p');

    if (filters?.status) {
      qb.andWhere('p.status = :status', { status: filters.status });
    }
    if (filters?.method) {
      qb.andWhere('p.method = :method', { method: filters.method });
    }
    if (filters?.search) {
      qb.andWhere(
        '(p.id::text ILIKE :search OR p.booking_id::text ILIKE :search OR p.user_name ILIKE :search OR p.transaction_id ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    qb.orderBy('p.created_at', 'DESC')
      .skip(pagination.skip)
      .take(pagination.limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponse(
      data,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  // ─── Admin: Revenue statistics ────────────────────────────────
  async getRevenueStats(): Promise<Record<string, any>> {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    interface StatsRow {
      totalRevenue: string;
      platformCommission: string;
      companyRevenue: string;
      totalPayments: string;
      successfulPayments: string;
      failedPayments: string;
      refundedPayments: string;
    }
    interface RevenueRow {
      revenue: string;
    }
    const [totals, todayRow, weekRow, monthRow] = (await Promise.all([
      this.paymentRepo
        .createQueryBuilder('p')
        .select(
          'SUM(CASE WHEN p.status = :completed THEN p.amount ELSE 0 END)',
          'totalRevenue',
        )
        .addSelect(
          'SUM(CASE WHEN p.status = :completed THEN p.platform_fee ELSE 0 END)',
          'platformCommission',
        )
        .addSelect(
          'SUM(CASE WHEN p.status = :completed THEN p.company_amount ELSE 0 END)',
          'companyRevenue',
        )
        .addSelect('COUNT(*)', 'totalPayments')
        .addSelect(
          'SUM(CASE WHEN p.status = :completed THEN 1 ELSE 0 END)',
          'successfulPayments',
        )
        .addSelect(
          'SUM(CASE WHEN p.status = :failed THEN 1 ELSE 0 END)',
          'failedPayments',
        )
        .addSelect(
          'SUM(CASE WHEN p.status = :refunded THEN 1 ELSE 0 END)',
          'refundedPayments',
        )
        .setParameters({
          completed: PaymentStatus.COMPLETED,
          failed: PaymentStatus.FAILED,
          refunded: PaymentStatus.REFUNDED,
        })
        .getRawOne(),
      this.paymentRepo
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.amount), 0)', 'revenue')
        .where('p.status = :completed AND p.completed_at >= :start', {
          completed: PaymentStatus.COMPLETED,
          start: todayStart,
        })
        .getRawOne(),
      this.paymentRepo
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.amount), 0)', 'revenue')
        .where('p.status = :completed AND p.completed_at >= :start', {
          completed: PaymentStatus.COMPLETED,
          start: weekStart,
        })
        .getRawOne(),
      this.paymentRepo
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.amount), 0)', 'revenue')
        .where('p.status = :completed AND p.completed_at >= :start', {
          completed: PaymentStatus.COMPLETED,
          start: monthStart,
        })
        .getRawOne(),
    ])) as [
      StatsRow | undefined,
      RevenueRow | undefined,
      RevenueRow | undefined,
      RevenueRow | undefined,
    ];

    const totalRevenue = parseInt(String(totals?.totalRevenue ?? '0'), 10);
    const successfulPayments = parseInt(
      String(totals?.successfulPayments ?? '0'),
      10,
    );

    return {
      totalRevenue,
      platformCommission: parseInt(
        String(totals?.platformCommission ?? '0'),
        10,
      ),
      companyRevenue: parseInt(String(totals?.companyRevenue ?? '0'), 10),
      todayRevenue: parseInt(String(todayRow?.revenue ?? '0'), 10),
      weekRevenue: parseInt(String(weekRow?.revenue ?? '0'), 10),
      monthRevenue: parseInt(String(monthRow?.revenue ?? '0'), 10),
      totalPayments: parseInt(String(totals?.totalPayments ?? '0'), 10),
      successfulPayments,
      failedPayments: parseInt(String(totals?.failedPayments ?? '0'), 10),
      refundedPayments: parseInt(String(totals?.refundedPayments ?? '0'), 10),
      averageTicketPrice:
        successfulPayments > 0
          ? Math.round(totalRevenue / successfulPayments)
          : 0,
    };
  }

  // ─── Admin: Refund payment ────────────────────────────────────
  async refund(paymentId: string, reason: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    payment.status = PaymentStatus.REFUNDED;
    payment.refundReason = reason;
    payment.refundedAt = new Date();

    const saved = await this.paymentRepo.save(payment);
    this.logger.log(`Payment ${paymentId} refunded: ${reason}`);
    return saved;
  }

  // ─── Admin: Retry failed payment ──────────────────────────────
  async retry(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }
    if (payment.status !== PaymentStatus.FAILED) {
      throw new BadRequestException('Only failed payments can be retried');
    }

    // Reset to pending for re-processing
    payment.status = PaymentStatus.PENDING;
    payment.failedReason = null as unknown as string;
    payment.processedAt = null as unknown as Date;
    const saved = await this.paymentRepo.save(payment);
    this.logger.log(`Payment ${paymentId} retried → PENDING`);
    return saved;
  }
}

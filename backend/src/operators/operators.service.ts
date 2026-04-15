import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Operator,
  OperatorStory,
  OperatorService,
  OperatorPolicy,
  Review,
  Booking,
} from '../database/entities';
import { BookingStatus } from '../common/constants';
import { CreateOperatorDto, UpdateOperatorDto, CreateReviewDto } from './dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';

@Injectable()
export class OperatorsService {
  constructor(
    @InjectRepository(Operator)
    private readonly operatorRepo: Repository<Operator>,
    @InjectRepository(OperatorStory)
    private readonly storyRepo: Repository<OperatorStory>,
    @InjectRepository(OperatorService)
    private readonly serviceRepo: Repository<OperatorService>,
    @InjectRepository(OperatorPolicy)
    private readonly policyRepo: Repository<OperatorPolicy>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  // ─── Public: List operators ────────────────────────────────────
  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Operator>> {
    const qb = this.operatorRepo
      .createQueryBuilder('o')
      .where('o.status = :status', { status: 'active' })
      .orderBy('o.name', 'ASC')
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

  // ─── Public: Operator detail ──────────────────────────────────
  async findOne(id: string): Promise<Operator> {
    const operator = await this.operatorRepo.findOne({
      where: { id },
    });
    if (!operator) {
      throw new NotFoundException(`Operator ${id} not found`);
    }
    return operator;
  }

  // ─── Public: Operator services ────────────────────────────────
  async findServices(operatorId: string): Promise<OperatorService[]> {
    await this.findOne(operatorId); // ensure exists
    return this.serviceRepo.find({
      where: { operatorId, isActive: true },
      order: { serviceName: 'ASC' },
    });
  }

  // ─── Public: Operator stories ─────────────────────────────────
  async findStories(operatorId: string): Promise<OperatorStory[]> {
    await this.findOne(operatorId);
    return this.storyRepo.find({
      where: { operatorId },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Public: Operator reviews ─────────────────────────────────
  async findReviews(
    operatorId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Review>> {
    await this.findOne(operatorId);

    const qb = this.reviewRepo
      .createQueryBuilder('r')
      .where('r.operator_id = :operatorId', { operatorId })
      .andWhere('r.status = :status', { status: 'approved' })
      .orderBy('r.reviewed_at', 'DESC')
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

  // ─── Operator policies ────────────────────────────────────────
  async findPolicies(operatorId: string): Promise<OperatorPolicy[]> {
    await this.findOne(operatorId);
    return this.policyRepo.find({
      where: { operatorId },
      order: { title: 'ASC' },
    });
  }

  // ─── Mobile: Create review ────────────────────────────────────
  async createReview(userId: string, dto: CreateReviewDto): Promise<Review> {
    // Verify operator exists
    await this.findOne(dto.operatorId);

    // Verify user had a completed booking for this trip
    const booking = await this.bookingRepo.findOne({
      where: {
        tripId: dto.tripId,
        userId,
        status: BookingStatus.COMPLETED,
      },
    });
    if (!booking) {
      throw new BadRequestException(
        'You can only review trips you have completed',
      );
    }

    // Check for duplicate review
    const existing = await this.reviewRepo.findOne({
      where: { tripId: dto.tripId, userId },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this trip');
    }

    const review = this.reviewRepo.create({
      tripId: dto.tripId,
      operatorId: dto.operatorId,
      userId,
      rating: dto.rating,
      title: dto.title,
      comment: dto.comment,
      aspects: dto.aspects || {},
      isVerifiedTraveler: true,
      status: 'approved', // auto-approve for now
    });

    const saved = await this.reviewRepo.save(review);

    // Recalculate operator rating
    await this.recalculateRating(dto.operatorId);

    return saved;
  }

  // ─── Mobile: User's own reviews ───────────────────────────────
  async findMyReviews(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Review>> {
    const qb = this.reviewRepo
      .createQueryBuilder('r')
      .where('r.user_id = :userId', { userId })
      .orderBy('r.reviewed_at', 'DESC')
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

  // ─── Mobile: Update review ────────────────────────────────────
  async updateReview(
    reviewId: string,
    userId: string,
    updates: Partial<CreateReviewDto>,
  ): Promise<Review> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId, userId },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (updates.rating !== undefined) review.rating = updates.rating;
    if (updates.title !== undefined) review.title = updates.title;
    if (updates.comment !== undefined) review.comment = updates.comment;
    if (updates.aspects !== undefined) review.aspects = updates.aspects;

    const saved = await this.reviewRepo.save(review);

    // Recalculate rating
    await this.recalculateRating(review.operatorId);

    return saved;
  }

  // ─── Mobile: Delete review ────────────────────────────────────
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId, userId },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const { operatorId } = review;
    await this.reviewRepo.remove(review);

    // Recalculate rating
    await this.recalculateRating(operatorId);
  }

  // ─── Admin: CRUD ──────────────────────────────────────────────
  async create(dto: CreateOperatorDto): Promise<Operator> {
    const existing = await this.operatorRepo.findOne({
      where: { id: dto.id },
    });
    if (existing) {
      throw new ConflictException(`Operator ${dto.id} already exists`);
    }

    const operator = this.operatorRepo.create(dto);
    return this.operatorRepo.save(operator);
  }

  async update(id: string, dto: UpdateOperatorDto): Promise<Operator> {
    const operator = await this.findOne(id);
    Object.assign(operator, dto);
    return this.operatorRepo.save(operator);
  }

  async remove(id: string): Promise<void> {
    const operator = await this.findOne(id);
    await this.operatorRepo.remove(operator);
  }

  // ─── Admin: List all (no status filter) ───────────────────────
  async findAllAdmin(
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Operator>> {
    const qb = this.operatorRepo
      .createQueryBuilder('o')
      .orderBy('o.created_at', 'DESC')
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

  // ─── Admin: Approve company ───────────────────────────────────
  async approve(id: string): Promise<Operator> {
    const operator = await this.findOne(id);
    operator.status = 'active';
    return this.operatorRepo.save(operator);
  }

  // ─── Admin: Suspend company ───────────────────────────────────
  async suspend(id: string, reason?: string): Promise<Operator> {
    const operator = await this.findOne(id);
    operator.status = 'suspended';
    if (reason) {
      operator.description = `[SUSPENDU] ${reason} — ${operator.description ?? ''}`;
    }
    return this.operatorRepo.save(operator);
  }

  // ─── Admin: Toggle company status ─────────────────────────────
  async toggleStatus(id: string): Promise<Operator> {
    const operator = await this.findOne(id);
    operator.status = operator.status === 'active' ? 'suspended' : 'active';
    return this.operatorRepo.save(operator);
  }

  // ─── Admin: Get operator statistics ───────────────────────────
  async getOperatorStats(id: string) {
    const operator = await this.findOne(id);

    const totalBookings = await this.bookingRepo.count({
      where: { operatorId: id },
    });

    const confirmedBookings = await this.bookingRepo.count({
      where: { operatorId: id, status: BookingStatus.CONFIRMED },
    });

    const totalRevenue: { total: string } | undefined = await this.bookingRepo
      .createQueryBuilder('b')
      .select('COALESCE(SUM(b.totalPrice), 0)', 'total')
      .where('b.operator_id = :id AND b.status = :status', {
        id,
        status: BookingStatus.CONFIRMED,
      })
      .getRawOne();

    return {
      operatorId: operator.id,
      name: operator.name,
      status: operator.status,
      rating: operator.rating,
      totalReviews: operator.totalReviews,
      totalBookings,
      confirmedBookings,
      totalRevenue: parseFloat(String(totalRevenue?.total ?? '0')),
    };
  }

  // ─── Private: Recalculate operator rating ─────────────────────

  async uploadLogo(
    id: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ): Promise<{ url: string }> {
    const operator = await this.findOne(id);
    // Store as base64 data-url (in production, upload to S3/GCS and store URL)
    const base64 = file.buffer.toString('base64');
    const url = `data:${file.mimetype};base64,${base64}`;
    operator.logoUrl = url;
    await this.operatorRepo.save(operator);
    return { url };
  }

  private async recalculateRating(operatorId: string): Promise<void> {
    const result: { avg: string | null; count: string } | undefined =
      await this.reviewRepo
        .createQueryBuilder('r')
        .select('AVG(r.rating)', 'avg')
        .addSelect('COUNT(*)', 'count')
        .where('r.operator_id = :operatorId AND r.status = :status', {
          operatorId,
          status: 'approved',
        })
        .getRawOne();

    const avg = parseFloat(String(result?.avg ?? '0'));
    const count = parseInt(String(result?.count ?? '0'), 10);

    await this.operatorRepo.update(
      { id: operatorId },
      {
        rating: Math.round(avg * 100) / 100,
        totalReviews: count,
      },
    );
  }

  // ─── Admin: Reviews ───────────────────────────────────────────
  async findAllReviewsAdmin(
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Review>> {
    const [data, total] = await this.reviewRepo.findAndCount({
      relations: ['user', 'operator'],
      order: { reviewedAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });
    return new PaginatedResponse(
      data,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async findOneReviewAdmin(id: string): Promise<Review> {
    const review = await this.reviewRepo.findOne({
      where: { id },
      relations: ['user', 'operator'],
    });
    if (!review) throw new NotFoundException(`Review ${id} not found`);
    return review;
  }

  async deleteReviewAdmin(id: string): Promise<void> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException(`Review ${id} not found`);
    const { operatorId } = review;
    await this.reviewRepo.remove(review);
    await this.recalculateRating(operatorId);
  }

  // ─── Admin: Operator Services ─────────────────────────────────
  async findAllServicesAdmin(
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<OperatorService>> {
    const [data, total] = await this.serviceRepo.findAndCount({
      relations: ['operator'],
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });
    return new PaginatedResponse(
      data,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async findOneServiceAdmin(id: string): Promise<OperatorService> {
    const svc = await this.serviceRepo.findOne({
      where: { id },
      relations: ['operator'],
    });
    if (!svc) throw new NotFoundException(`OperatorService ${id} not found`);
    return svc;
  }

  async createServiceAdmin(
    dto: Partial<OperatorService>,
  ): Promise<OperatorService> {
    const svc = this.serviceRepo.create(dto);
    return this.serviceRepo.save(svc);
  }

  async updateServiceAdmin(
    id: string,
    dto: Partial<OperatorService>,
  ): Promise<OperatorService> {
    const svc = await this.findOneServiceAdmin(id);
    Object.assign(svc, dto);
    return this.serviceRepo.save(svc);
  }

  async deleteServiceAdmin(id: string): Promise<void> {
    const svc = await this.findOneServiceAdmin(id);
    await this.serviceRepo.remove(svc);
  }
}

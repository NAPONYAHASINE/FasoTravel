import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as crypto from 'crypto';
import {
  ApiKey,
  Trip,
  Ticket,
  Station,
  Route,
  Booking,
  CashTransaction,
  Operator,
} from '../database/entities';
import { DEFAULT_TOTAL_SEATS, TICKET_CODE_LENGTH } from '../common/constants';
import { generateAlphanumericCode } from '../common/utils/code-generator';
import {
  CreateApiKeyDto,
  ExternalCreateTripDto,
  ExternalUpdateTripStatusDto,
  ExternalCreateTicketDto,
  ExternalLocationDto,
  ExternalCashTransactionDto,
  ExternalQueryDto,
} from './dto';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';

@Injectable()
export class ExternalApiService {
  private readonly logger = new Logger(ExternalApiService.name);

  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(Station)
    private readonly stationRepo: Repository<Station>,
    @InjectRepository(Route)
    private readonly routeRepo: Repository<Route>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(CashTransaction)
    private readonly cashTxRepo: Repository<CashTransaction>,
    @InjectRepository(Operator)
    private readonly operatorRepo: Repository<Operator>,
  ) {}

  // ═══════ API KEY MANAGEMENT ═══════

  async createApiKey(operatorId: string, dto: CreateApiKeyDto) {
    // Verify operator exists
    const operator = await this.operatorRepo.findOne({
      where: { id: operatorId },
    });
    if (!operator) {
      throw new NotFoundException(`Operator ${operatorId} not found`);
    }

    const rawKey = `fsk_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 12);

    const apiKey = this.apiKeyRepo.create({
      operatorId,
      keyHash,
      keyPrefix,
      name: dto.name,
      scopes: dto.scopes ?? [
        'trips:read',
        'trips:write',
        'tickets:read',
        'tickets:write',
        'stations:read',
        'routes:read',
        'analytics:read',
        'cash:read',
        'cash:write',
      ],
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      rateLimit: dto.rateLimit ?? 100,
    });

    await this.apiKeyRepo.save(apiKey);

    this.logger.log(
      `API key created for operator ${operatorId}: ${keyPrefix}...`,
    );

    // Return the raw key ONCE — it cannot be retrieved again
    return {
      id: apiKey.id,
      key: rawKey,
      prefix: keyPrefix,
      name: apiKey.name,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      rateLimit: apiKey.rateLimit,
      message: 'Store this API key securely. It cannot be retrieved again.',
    };
  }

  async listApiKeys(operatorId: string) {
    const keys = await this.apiKeyRepo.find({
      where: { operatorId },
      order: { createdAt: 'DESC' },
    });
    return keys.map((k) => ({
      id: k.id,
      prefix: k.keyPrefix,
      name: k.name,
      scopes: k.scopes,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
      createdAt: k.createdAt,
    }));
  }

  async revokeApiKey(operatorId: string, keyId: string) {
    const key = await this.apiKeyRepo.findOne({
      where: { id: keyId, operatorId },
    });
    if (!key) {
      throw new NotFoundException('API key not found');
    }
    key.isActive = false;
    await this.apiKeyRepo.save(key);
    return { message: 'API key revoked' };
  }

  // ═══════ INJECTION: Trips ═══════

  async injectTrip(operatorId: string, dto: ExternalCreateTripDto) {
    const from = await this.stationRepo.findOne({
      where: { id: dto.fromStationId },
    });
    const to = await this.stationRepo.findOne({
      where: { id: dto.toStationId },
    });
    if (!from || !to) {
      throw new BadRequestException('Invalid station ID(s)');
    }

    const tripId = crypto.randomUUID();
    const trip = this.tripRepo.create({
      id: tripId,
      operatorId,
      fromStationId: dto.fromStationId,
      fromStationName: from.name,
      toStationId: dto.toStationId,
      toStationName: to.name,
      departureTime: new Date(dto.departureTime),
      arrivalTime: dto.arrivalTime
        ? new Date(dto.arrivalTime)
        : new Date(dto.departureTime),
      basePrice: dto.price,
      totalSeats: dto.totalSeats ?? DEFAULT_TOTAL_SEATS,
      availableSeats: dto.totalSeats ?? DEFAULT_TOTAL_SEATS,
      status: 'scheduled',
      vehicleId: dto.vehicleId,
      routeId: dto.routeId,
    });

    const saved = await this.tripRepo.save(trip);
    this.logger.log(
      `External trip injected: ${saved.id} by operator ${operatorId}`,
    );
    return saved;
  }

  async updateTripStatus(
    operatorId: string,
    tripId: string,
    dto: ExternalUpdateTripStatusDto,
  ) {
    const trip = await this.tripRepo.findOne({
      where: { id: tripId, operatorId },
    });
    if (!trip) {
      throw new NotFoundException(
        'Trip not found or does not belong to your company',
      );
    }

    trip.status = dto.status;
    if (dto.delayMinutes && trip.departureTime) {
      trip.departureTime = new Date(
        trip.departureTime.getTime() + dto.delayMinutes * 60 * 1000,
      );
    }

    const saved = await this.tripRepo.save(trip);
    this.logger.log(`External trip ${tripId} status updated to ${dto.status}`);
    return saved;
  }

  async pushLocation(
    operatorId: string,
    tripId: string,
    dto: ExternalLocationDto,
  ) {
    const trip = await this.tripRepo.findOne({
      where: { id: tripId, operatorId },
    });
    if (!trip) {
      throw new NotFoundException(
        'Trip not found or does not belong to your company',
      );
    }

    trip.gpsLatitude = dto.latitude;
    trip.gpsLongitude = dto.longitude;
    trip.lastLocationUpdate = new Date();
    await this.tripRepo.save(trip);

    return {
      tripId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      updatedAt: new Date().toISOString(),
    };
  }

  // ═══════ INJECTION: Tickets ═══════

  async injectTicket(operatorId: string, dto: ExternalCreateTicketDto) {
    const trip = await this.tripRepo.findOne({
      where: { id: dto.tripId, operatorId },
    });
    if (!trip) {
      throw new BadRequestException(
        'Trip not found or does not belong to your company',
      );
    }

    const code = generateAlphanumericCode(TICKET_CODE_LENGTH);

    const ticket = this.ticketRepo.create({
      tripId: dto.tripId,
      passengerName: dto.passengerName,
      passengerPhone: dto.passengerPhone,
      seatNumber: dto.seatNumber,
      price: dto.price,
      alphanumericCode: code,
      status: 'active',
      operatorId,
    });

    const saved = await this.ticketRepo.save(ticket);

    // Decrement available seats
    if (trip.availableSeats > 0) {
      trip.availableSeats -= 1;
      await this.tripRepo.save(trip);
    }

    this.logger.log(
      `External ticket injected: ${saved.id} for trip ${dto.tripId}`,
    );
    return saved;
  }

  // ═══════ INJECTION: Cash Transactions ═══════

  async injectCashTransaction(
    operatorId: string,
    dto: ExternalCashTransactionDto,
  ) {
    const tx = this.cashTxRepo.create({
      operatorId,
      type: dto.type,
      amount: dto.amount,
      notes: dto.description,
      stationId: dto.stationId,
      cashierId: dto.cashierId ?? '00000000-0000-0000-0000-000000000000',
    });

    const saved = await this.cashTxRepo.save(tx);
    this.logger.log(`External cash transaction injected: ${saved.id}`);
    return saved;
  }

  // ═══════ EXTRACTION: Read endpoints ═══════

  async getTrips(operatorId: string, query: ExternalQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const qb = this.tripRepo
      .createQueryBuilder('t')
      .where('t.operator_id = :operatorId', { operatorId })
      .orderBy('t.departure_time', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      qb.andWhere('t.status = :status', { status: query.status });
    }
    if (query.from) {
      qb.andWhere('t.departure_time >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('t.departure_time <= :to', { to: new Date(query.to) });
    }

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponse(data, total, page, limit);
  }

  async getTickets(operatorId: string, query: ExternalQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const qb = this.ticketRepo
      .createQueryBuilder('t')
      .innerJoin('t.trip', 'trip')
      .where('trip.operator_id = :operatorId', { operatorId })
      .orderBy('t.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      qb.andWhere('t.status = :status', { status: query.status });
    }

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponse(data, total, page, limit);
  }

  async getBookings(operatorId: string, query: ExternalQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .where('b.operator_id = :operatorId', { operatorId })
      .orderBy('b.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      qb.andWhere('b.status = :status', { status: query.status });
    }

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponse(data, total, page, limit);
  }

  async getStations(operatorId: string) {
    return this.stationRepo.find({
      where: { operatorId },
      order: { name: 'ASC' },
    });
  }

  async getRoutes(operatorId: string) {
    // Routes are station-pair caches; get routes relevant to this operator's stations
    const stations = await this.stationRepo.find({
      where: { operatorId },
      select: ['id'],
    });
    const stationIds = stations.map((s) => s.id);
    if (stationIds.length === 0) return [];

    return this.routeRepo
      .createQueryBuilder('r')
      .where('r.from_station_id IN (:...ids) OR r.to_station_id IN (:...ids)', {
        ids: stationIds,
      })
      .getMany();
  }

  async getAnalytics(operatorId: string, query: ExternalQueryDto) {
    const from = query.from
      ? new Date(query.from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = query.to ? new Date(query.to) : new Date();

    const totalTrips = await this.tripRepo.count({
      where: {
        operatorId,
        departureTime: Between(from, to),
      },
    });

    const revenueResult: { revenue: string; bookings: string } | undefined =
      await this.bookingRepo
        .createQueryBuilder('b')
        .select('COALESCE(SUM(b.totalPrice), 0)', 'revenue')
        .addSelect('COUNT(*)', 'bookings')
        .where(
          'b.operator_id = :operatorId AND b.created_at BETWEEN :from AND :to',
          { operatorId, from, to },
        )
        .getRawOne();

    const ticketCount = await this.ticketRepo
      .createQueryBuilder('t')
      .innerJoin('t.trip', 'trip')
      .where(
        'trip.operator_id = :operatorId AND t.created_at BETWEEN :from AND :to',
        { operatorId, from, to },
      )
      .getCount();

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      totalTrips,
      totalBookings: parseInt(String(revenueResult?.bookings ?? '0'), 10),
      totalTicketsSold: ticketCount,
      totalRevenue: parseFloat(String(revenueResult?.revenue ?? '0')),
    };
  }

  async getCashTransactions(operatorId: string, query: ExternalQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const qb = this.cashTxRepo
      .createQueryBuilder('ct')
      .where('ct.operator_id = :operatorId', { operatorId })
      .orderBy('ct.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.from) {
      qb.andWhere('ct.created_at >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('ct.created_at <= :to', { to: new Date(query.to) });
    }

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponse(data, total, page, limit);
  }
}

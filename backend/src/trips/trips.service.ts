import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip, Segment, Seat, TripSchedule } from '../database/entities';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { SearchTripsDto, CreateTripDto, UpdateTripDto } from './dto';
import { TripFilterQuery } from './dto/trip-filter-query.dto';
import { randomUUID } from 'crypto';
import {
  DEFAULT_TOTAL_SEATS,
  DEFAULT_TRIP_DURATION_MINUTES,
  ADMIN_TRIPS_PAGE_SIZE,
} from '../common/constants';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Segment)
    private readonly segmentRepo: Repository<Segment>,
    @InjectRepository(Seat)
    private readonly seatRepo: Repository<Seat>,
    @InjectRepository(TripSchedule)
    private readonly scheduleRepo: Repository<TripSchedule>,
  ) {}

  async findAll(query: TripFilterQuery): Promise<Trip[]> {
    const qb = this.tripRepo.createQueryBuilder('t');

    if (query.operatorId) {
      qb.andWhere('t.operator_id = :operatorId', {
        operatorId: query.operatorId,
      });
    }
    if (query.routeId) {
      qb.andWhere('t.route_id = :routeId', { routeId: query.routeId });
    }
    if (query.gareId) {
      qb.andWhere('t.gare_id = :gareId', { gareId: query.gareId });
    }
    if (query.status) {
      qb.andWhere('t.status = :status', { status: query.status });
    }
    if (query.dateFrom) {
      qb.andWhere('t.departure_time >= :dateFrom', {
        dateFrom: query.dateFrom,
      });
    }
    if (query.dateTo) {
      qb.andWhere('t.departure_time <= :dateTo', { dateTo: query.dateTo });
    }

    qb.orderBy('t.departure_time', 'DESC');
    return qb.getMany();
  }

  async generateFromTemplates(operatorId: string, date: string) {
    const templates = await this.scheduleRepo.find({
      where: { operatorId },
    });
    const generated: Trip[] = [];
    for (const tmpl of templates) {
      const id = `trip-${randomUUID().slice(0, 8)}`;
      const depDate = new Date(`${date}T${tmpl.departureTime}`);
      const arrDate = new Date(
        depDate.getTime() +
          (tmpl.durationMinutes ?? DEFAULT_TRIP_DURATION_MINUTES) * 60_000,
      );
      const trip = this.tripRepo.create({
        id,
        operatorId,
        fromStationId: tmpl.fromStopId,
        toStationId: tmpl.toStopId,
        departureTime: depDate,
        arrivalTime: arrDate,
        basePrice: tmpl.basePrice,
        durationMinutes: tmpl.durationMinutes,
        vehicleId: tmpl.vehicleId,
        status: 'scheduled',
        availableSeats: DEFAULT_TOTAL_SEATS,
        totalSeats: DEFAULT_TOTAL_SEATS,
      });
      generated.push(trip);
    }
    if (generated.length > 0) {
      await this.tripRepo.save(generated);
    }
    return { generated: generated.length, date };
  }

  async search(dto: SearchTripsDto): Promise<Trip[]> {
    const dateStart = new Date(`${dto.date}T00:00:00`);
    const dateEnd = new Date(`${dto.date}T23:59:59`);

    const trips = await this.tripRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.fromStation', 'fromStation')
      .leftJoinAndSelect('t.toStation', 'toStation')
      .where('t.status != :cancelled', { cancelled: 'cancelled' })
      .andWhere('t.departure_time BETWEEN :dateStart AND :dateEnd', {
        dateStart,
        dateEnd,
      })
      .andWhere(
        '(LOWER(t.from_station_name) LIKE LOWER(:from) OR LOWER(fromStation.city) LIKE LOWER(:from) OR t.from_station_id = :fromExact)',
        { from: `%${dto.from}%`, fromExact: dto.from },
      )
      .andWhere(
        '(LOWER(t.to_station_name) LIKE LOWER(:to) OR LOWER(toStation.city) LIKE LOWER(:to) OR t.to_station_id = :toExact)',
        { to: `%${dto.to}%`, toExact: dto.to },
      )
      .andWhere('t.available_seats >= :passengers', {
        passengers: dto.passengers,
      })
      .orderBy('t.departure_time', 'ASC')
      .getMany();

    return trips;
  }

  async findPopular(
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Trip>> {
    const qb = this.tripRepo
      .createQueryBuilder('t')
      .where('t.status != :cancelled', { cancelled: 'cancelled' })
      .andWhere('t.departure_time > NOW()')
      .orderBy('t.total_seats - t.available_seats', 'DESC')
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

  async findOne(tripId: string): Promise<Trip & { segments: Segment[] }> {
    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      relations: ['fromStation', 'toStation', 'operator'],
    });
    if (!trip) {
      throw new NotFoundException(`Trip ${tripId} not found`);
    }

    const segments = await this.segmentRepo.find({
      where: { tripId },
      order: { sequenceNumber: 'ASC' },
      relations: ['fromStop', 'toStop'],
    });

    return { ...trip, segments };
  }

  async getSeats(tripId: string): Promise<Seat[]> {
    const trip = await this.tripRepo.findOne({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException(`Trip ${tripId} not found`);
    }

    return this.seatRepo.find({
      where: { tripId },
      order: { seatNumber: 'ASC' },
    });
  }

  async create(dto: CreateTripDto): Promise<Trip> {
    const existing = await this.tripRepo.findOne({
      where: { id: dto.id },
    });
    if (existing) {
      throw new ConflictException(`Trip ${dto.id} already exists`);
    }

    const trip = this.tripRepo.create({
      ...dto,
      availableSeats: dto.totalSeats,
    });
    return this.tripRepo.save(trip);
  }

  async update(tripId: string, dto: UpdateTripDto): Promise<Trip> {
    const trip = await this.tripRepo.findOne({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException(`Trip ${tripId} not found`);
    }
    Object.assign(trip, dto);
    return this.tripRepo.save(trip);
  }

  async remove(tripId: string): Promise<void> {
    const trip = await this.tripRepo.findOne({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException(`Trip ${tripId} not found`);
    }
    await this.tripRepo.remove(trip);
  }

  // ─── ADMIN ───

  async getAdminSummary(pagination: PaginationDto) {
    const [data, total] = await this.tripRepo.findAndCount({
      order: { departureTime: 'DESC' },
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

  async getAdminStats() {
    const total = await this.tripRepo.count();
    const scheduled = await this.tripRepo.count({
      where: { status: 'scheduled' },
    });
    const completed = await this.tripRepo.count({
      where: { status: 'completed' },
    });
    const cancelled = await this.tripRepo.count({
      where: { status: 'cancelled' },
    });
    return { total, scheduled, completed, cancelled };
  }

  async getAdminSummaryByCompany(companyId: string) {
    return this.tripRepo.find({
      where: { operatorId: companyId },
      order: { departureTime: 'DESC' },
      take: ADMIN_TRIPS_PAGE_SIZE,
    });
  }

  async findPopularRoutes() {
    const routes = await this.tripRepo
      .createQueryBuilder('t')
      .select('t.from_station_id', 'from_id')
      .addSelect('t.to_station_id', 'to_id')
      .addSelect('COUNT(*)', 'trip_count')
      .addSelect('ROUND(AVG(t.base_price))', 'avg_price')
      .groupBy('t.from_station_id')
      .addGroupBy('t.to_station_id')
      .orderBy('trip_count', 'DESC')
      .limit(10)
      .getRawMany<{
        from_id: string;
        to_id: string;
        trip_count: string;
        avg_price: string;
      }>();

    return routes.map((r, i) => ({
      id: `route_${i + 1}`,
      from: r.from_id,
      to: r.to_id,
      from_id: r.from_id,
      to_id: r.to_id,
      trip_count: parseInt(r.trip_count, 10),
      avg_price: parseInt(r.avg_price, 10),
    }));
  }
}

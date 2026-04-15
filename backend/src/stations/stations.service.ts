import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between } from 'typeorm';
import { Station, Trip, Ticket } from '../database/entities';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';
import {
  CreateStationDto,
  UpdateStationDto,
  StationFilterDto,
  NearbyStationsDto,
} from './dto';
import { HeartbeatService } from '../heartbeat/heartbeat.service';

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station)
    private readonly stationRepo: Repository<Station>,
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    private readonly heartbeatService: HeartbeatService,
  ) {}

  async findAll(filter: StationFilterDto): Promise<PaginatedResponse<Station>> {
    const qb = this.stationRepo.createQueryBuilder('s');

    if (filter.city) {
      qb.andWhere('LOWER(s.city) = LOWER(:city)', { city: filter.city });
    }

    if (filter.search) {
      qb.andWhere(
        '(LOWER(s.name) LIKE LOWER(:search) OR LOWER(s.address) LIKE LOWER(:search))',
        { search: `%${filter.search}%` },
      );
    }

    if (filter.operatorId) {
      qb.andWhere('s.operator_id = :operatorId', {
        operatorId: filter.operatorId,
      });
    }

    qb.andWhere('s.status = :status', { status: 'active' });

    const sortColumn = filter.sort || 'name';
    const allowedSorts = ['name', 'city', 'created_at'];
    const safeSort = allowedSorts.includes(sortColumn) ? sortColumn : 'name';
    qb.orderBy(`s.${safeSort}`, filter.order || 'ASC');

    qb.skip(filter.skip).take(filter.limit);

    const [data, total] = await qb.getManyAndCount();

    // Enrich stations with heartbeat info
    const stationIds = data.map((s) => s.id);
    const heartbeatMap =
      await this.heartbeatService.getStationsHeartbeatInfo(stationIds);

    const enriched = data.map((s) => {
      const hb = heartbeatMap.get(s.id);
      return {
        ...s,
        isConnected: hb?.isConnected ?? false,
        activeCashiers: hb?.activeCashiers ?? 0,
        lastHeartbeat: hb?.lastHeartbeat ?? null,
      };
    });

    return new PaginatedResponse(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      enriched as any,
      total,
      filter.page,
      filter.limit,
    );
  }

  async findNearby(dto: NearbyStationsDto): Promise<
    {
      station: Station & { distance?: number };
      distance_km: number;
      next_departures: Trip[];
    }[]
  > {
    const stations = await this.stationRepo
      .createQueryBuilder('s')
      .addSelect(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(s.latitude))
            * cos(radians(s.longitude) - radians(:lon))
            + sin(radians(:lat)) * sin(radians(s.latitude))
          )
        )`,
        'distance',
      )
      .where('s.latitude IS NOT NULL AND s.longitude IS NOT NULL')
      .andWhere("s.status = 'active'")
      .having(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(s.latitude))
            * cos(radians(s.longitude) - radians(:lon))
            + sin(radians(:lat)) * sin(radians(s.latitude))
          )
        ) <= :radius`,
      )
      .setParameters({
        lat: dto.latitude,
        lon: dto.longitude,
        radius: dto.radiusKm,
      })
      .orderBy('distance', 'ASC')
      .groupBy('s.id')
      .getRawAndEntities();

    const now = new Date();

    // Enrich each station with next_departures (up to 3 upcoming trips)
    const results = await Promise.all(
      stations.entities.map(async (station, i) => {
        const distanceKm = parseFloat(
          String(
            (stations.raw as Record<string, string>[])[i]?.distance ?? '0',
          ),
        );

        const nextTrips = await this.tripRepo.find({
          where: {
            fromStationId: station.id,
            departureTime: MoreThan(now),
            status: 'scheduled',
          },
          order: { departureTime: 'ASC' },
          take: 3,
        });

        return {
          station: { ...station, distance: distanceKm },
          distance_km: Math.round(distanceKm * 10) / 10,
          next_departures: nextTrips,
        };
      }),
    );

    return results;
  }

  async findOne(id: string): Promise<
    Station & {
      isConnected?: boolean;
      activeCashiers?: number;
      lastHeartbeat?: Date;
    }
  > {
    const station = await this.stationRepo.findOne({
      where: { id },
      relations: ['operator'],
    });
    if (!station) {
      throw new NotFoundException(`Station ${id} not found`);
    }

    const heartbeatMap = await this.heartbeatService.getStationsHeartbeatInfo([
      id,
    ]);
    const hb = heartbeatMap.get(id);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      ...station,
      isConnected: hb?.isConnected ?? false,
      activeCashiers: hb?.activeCashiers ?? 0,
      lastHeartbeat: hb?.lastHeartbeat ?? null,
    } as any;
  }

  async create(dto: CreateStationDto): Promise<Station> {
    const existing = await this.stationRepo.findOne({
      where: { id: dto.id },
    });
    if (existing) {
      throw new ConflictException(`Station with ID ${dto.id} already exists`);
    }
    const station = this.stationRepo.create(dto);
    return this.stationRepo.save(station);
  }

  async update(id: string, dto: UpdateStationDto): Promise<Station> {
    const station = await this.findOne(id);
    Object.assign(station, dto);
    return this.stationRepo.save(station);
  }

  async remove(id: string): Promise<void> {
    const station = await this.findOne(id);
    await this.stationRepo.remove(station);
  }

  // ========== STATION STATS ==========

  async getAllStationStats() {
    const stations = await this.stationRepo.find({
      where: { status: 'active' },
    });
    return Promise.all(stations.map((s) => this.buildStationStats(s)));
  }

  async getGlobalStationStats() {
    const total = await this.stationRepo.count();
    const active = await this.stationRepo.count({
      where: { status: 'active' },
    });
    const inactive = total - active;

    const today = this.startOfDay(new Date());
    const tomorrow = this.startOfDay(new Date(today.getTime() + 86_400_000));
    const yesterday = this.startOfDay(new Date(today.getTime() - 86_400_000));

    const salesToday = await this.ticketSalesForStations(today, tomorrow);
    const salesYesterday = await this.ticketSalesForStations(yesterday, today);

    const revToday = await this.ticketRevenueForStations(today, tomorrow);
    const revYesterday = await this.ticketRevenueForStations(yesterday, today);

    let busiestStation = '';
    let busiestSales = 0;
    if (active > 0) {
      const allStats = await this.getAllStationStats();
      for (const s of allStats) {
        if (s.sales_today > busiestSales) {
          busiestSales = s.sales_today;
          busiestStation = s.station_name;
        }
      }
    }

    return {
      total_stations: total,
      active_stations: active,
      inactive_stations: inactive,
      active_percentage: total > 0 ? Math.round((active / total) * 100) : 0,
      total_sales_today: salesToday,
      total_sales_yesterday: salesYesterday,
      total_revenue_today: revToday,
      total_revenue_yesterday: revYesterday,
      busiest_station: busiestStation,
      busiest_station_sales: busiestSales,
      avg_sales_per_station: active > 0 ? Math.round(salesToday / active) : 0,
      avg_revenue_per_station: active > 0 ? Math.round(revToday / active) : 0,
    };
  }

  async getStationStats(stationId: string) {
    const station = await this.findOne(stationId);
    return this.buildStationStats(station);
  }

  private async buildStationStats(station: Station) {
    const now = new Date();
    const today = this.startOfDay(now);
    const tomorrow = this.startOfDay(new Date(today.getTime() + 86_400_000));
    const yesterday = this.startOfDay(new Date(today.getTime() - 86_400_000));
    const weekAgo = this.startOfDay(new Date(today.getTime() - 7 * 86_400_000));
    const monthAgo = this.startOfDay(
      new Date(today.getTime() - 30 * 86_400_000),
    );

    const tripIds = await this.tripIdsForStation(station.id);

    const salesToday = await this.countTickets(tripIds, today, tomorrow);
    const salesYesterday = await this.countTickets(tripIds, yesterday, today);
    const salesWeek = await this.countTickets(tripIds, weekAgo, tomorrow);
    const salesMonth = await this.countTickets(tripIds, monthAgo, tomorrow);

    const revToday = await this.sumRevenue(tripIds, today, tomorrow);
    const revYesterday = await this.sumRevenue(tripIds, yesterday, today);
    const revWeek = await this.sumRevenue(tripIds, weekAgo, tomorrow);
    const revMonth = await this.sumRevenue(tripIds, monthAgo, tomorrow);

    const departures = await this.tripRepo.count({
      where: {
        fromStationId: station.id,
        departureTime: Between(today, tomorrow),
        status: 'scheduled',
      },
    });
    const arrivals = await this.tripRepo.count({
      where: {
        toStationId: station.id,
        departureTime: Between(today, tomorrow),
      },
    });

    const dailyChange =
      salesYesterday > 0
        ? Math.round(((salesToday - salesYesterday) / salesYesterday) * 1000) /
          10
        : 0;
    const weeklyPrev = salesWeek - salesToday;
    const weeklyChange =
      weeklyPrev > 0
        ? Math.round(
            ((salesToday - weeklyPrev / 6) / (weeklyPrev / 6)) * 1000,
          ) / 10
        : 0;

    return {
      station_id: station.id,
      station_name: station.name,
      sales_today: salesToday,
      sales_yesterday: salesYesterday,
      sales_this_week: salesWeek,
      sales_this_month: salesMonth,
      sales_change_daily: dailyChange,
      sales_change_weekly: weeklyChange,
      revenue_today: revToday,
      revenue_yesterday: revYesterday,
      revenue_this_week: revWeek,
      revenue_this_month: revMonth,
      active_departures_today: departures,
      active_arrivals_today: arrivals,
      peak_hour: '08:00',
      avg_ticket_price: salesToday > 0 ? Math.round(revToday / salesToday) : 0,
    };
  }

  private async tripIdsForStation(stationId: string): Promise<string[]> {
    const trips = await this.tripRepo.find({
      where: [{ fromStationId: stationId }, { toStationId: stationId }],
      select: ['id'],
    });
    return trips.map((t) => t.id);
  }

  private async countTickets(
    tripIds: string[],
    from: Date,
    to: Date,
  ): Promise<number> {
    if (tripIds.length === 0) return 0;
    return this.ticketRepo
      .createQueryBuilder('t')
      .where('t.trip_id IN (:...tripIds)', { tripIds })
      .andWhere('t.created_at BETWEEN :from AND :to', { from, to })
      .getCount();
  }

  private async sumRevenue(
    tripIds: string[],
    from: Date,
    to: Date,
  ): Promise<number> {
    if (tripIds.length === 0) return 0;
    const result = await this.ticketRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.price), 0)', 'total')
      .where('t.trip_id IN (:...tripIds)', { tripIds })
      .andWhere('t.created_at BETWEEN :from AND :to', { from, to })
      .getRawOne<{ total: string }>();
    return parseInt(result?.total ?? '0', 10);
  }

  private async ticketSalesForStations(from: Date, to: Date): Promise<number> {
    return this.ticketRepo
      .createQueryBuilder('t')
      .where('t.created_at BETWEEN :from AND :to', { from, to })
      .getCount();
  }

  private async ticketRevenueForStations(
    from: Date,
    to: Date,
  ): Promise<number> {
    const result = await this.ticketRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.price), 0)', 'total')
      .where('t.created_at BETWEEN :from AND :to', { from, to })
      .getRawOne<{ total: string }>();
    return parseInt(result?.total ?? '0', 10);
  }

  private startOfDay(d: Date): Date {
    const r = new Date(d);
    r.setHours(0, 0, 0, 0);
    return r;
  }
}

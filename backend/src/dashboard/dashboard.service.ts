import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import {
  User,
  Booking,
  Trip,
  Payment,
  Operator,
  Station,
  Incident,
} from '../database/entities';
import {
  UserRole,
  BookingStatus,
  TripStatus,
  PaymentStatus,
} from '../common/constants';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Trip) private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Operator)
    private readonly operatorRepo: Repository<Operator>,
    @InjectRepository(Station)
    private readonly stationRepo: Repository<Station>,
    @InjectRepository(Incident)
    private readonly incidentRepo: Repository<Incident>,
  ) {}

  /* ────────── GET /admin/dashboard/stats ────────── */
  async getDashboardStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalCompanies,
      activeCompanies,
      pendingCompanies,
      totalPassengers,
      todayPassengers,
      totalBookings,
      todayBookings,
      cancelledBookings,
      activeTrips,
      todayTrips,
      pendingIncidents,
      totalStations,
      totalOperatorUsers,
    ] = await Promise.all([
      this.operatorRepo.count(),
      this.operatorRepo.count({ where: { status: 'active' } }),
      this.operatorRepo.count({ where: { status: 'pending' } }),
      this.userRepo.count({ where: { role: UserRole.PASSENGER } }),
      this.userRepo.count({
        where: {
          role: UserRole.PASSENGER,
          createdAt: MoreThanOrEqual(todayStart),
        },
      }),
      this.bookingRepo.count(),
      this.bookingRepo.count({
        where: { createdAt: MoreThanOrEqual(todayStart) },
      }),
      this.bookingRepo.count({
        where: { status: BookingStatus.CANCELLED },
      }),
      this.tripRepo.count({
        where: [
          { status: TripStatus.DEPARTED },
          { status: TripStatus.BOARDING },
        ],
      }),
      this.tripRepo.count({
        where: { createdAt: MoreThanOrEqual(todayStart) },
      }),
      this.incidentRepo.count({ where: { status: 'open' } }),
      this.stationRepo.count(),
      this.userRepo.count({
        where: [
          { role: UserRole.OPERATOR_ADMIN },
          { role: UserRole.RESPONSABLE },
          { role: UserRole.MANAGER },
        ],
      }),
    ]);

    // Revenue aggregation
    const revenueResult = await this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.status = :status', { status: PaymentStatus.COMPLETED })
      .getRawOne<{ total: string }>();
    const totalRevenue = Number(revenueResult?.total ?? 0);

    const todayRevenueResult = await this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.status = :status', { status: PaymentStatus.COMPLETED })
      .andWhere('p.created_at >= :since', { since: todayStart })
      .getRawOne<{ total: string }>();
    const todayRevenue = Number(todayRevenueResult?.total ?? 0);

    return {
      totalCompanies,
      activeCompanies,
      pendingCompanies,
      totalRevenue,
      todayRevenue,
      activeTrips,
      todayTrips,
      totalPassengers,
      todayPassengers,
      totalBookings,
      todayBookings,
      cancelledBookings,
      pendingIncidents,
      systemHealth: 100,
      totalStations,
      totalOperatorUsers,
    };
  }

  /* ────────── GET /admin/analytics/platform ────────── */
  async getPlatformGrowthMetrics(query: {
    period?: string;
    includeStations?: boolean;
  }) {
    const weeklyRegistrations = await this.getWeeklyRegistrations(
      query.period ?? 'week',
    );
    const stationActivities = query.includeStations
      ? await this.getStationActivities(5)
      : [];

    const totalPassengers = await this.userRepo.count({
      where: { role: UserRole.PASSENGER },
    });
    const activePassengers = await this.userRepo.count({
      where: { role: UserRole.PASSENGER, status: 'active' },
    });
    const verifiedPassengers = await this.userRepo.count({
      where: { role: UserRole.PASSENGER, isVerified: true },
    });
    const totalCompanies = await this.operatorRepo.count();
    const activeCompanies = await this.operatorRepo.count({
      where: { status: 'active' },
    });
    const pendingCompanies = await this.operatorRepo.count({
      where: { status: 'pending' },
    });

    return {
      weeklyRegistrations,
      stationActivities,
      totalCompanies,
      totalPassengers,
      activeCompanies,
      activePassengers,
      verifiedPassengers,
      pendingCompanies,
      growthRate: { companies: 0, passengers: 0 },
    };
  }

  /* ────────── GET /admin/analytics/registrations ────────── */
  async getWeeklyRegistrations(_period: string) {
    const weeks = 8;
    const results: { week: string; companies: number; passengers: number }[] =
      [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const [passengers, companies] = await Promise.all([
        this.userRepo
          .createQueryBuilder('u')
          .where('u.role = :role', { role: UserRole.PASSENGER })
          .andWhere('u.created_at >= :start AND u.created_at < :end', {
            start: weekStart,
            end: weekEnd,
          })
          .getCount(),
        this.operatorRepo
          .createQueryBuilder('o')
          .where('o.created_at >= :start AND o.created_at < :end', {
            start: weekStart,
            end: weekEnd,
          })
          .getCount(),
      ]);

      results.push({
        week: weekStart.toISOString().slice(0, 10),
        companies,
        passengers,
      });
    }

    return results;
  }

  /* ────────── GET /admin/analytics/stations/activity ────────── */
  async getStationActivities(limit: number) {
    const departures = await this.tripRepo
      .createQueryBuilder('t')
      .select('t.from_station_id', 'stationId')
      .addSelect('s.name', 'stationName')
      .addSelect('COUNT(*)', 'departures')
      .leftJoin('stations', 's', 's.station_id = t.from_station_id')
      .groupBy('t.from_station_id')
      .addGroupBy('s.name')
      .orderBy('departures', 'DESC')
      .limit(limit)
      .getRawMany<{
        stationId: string;
        stationName: string;
        departures: string;
      }>();

    return departures.map((d) => ({
      stationId: d.stationId,
      stationName: d.stationName ?? 'Unknown',
      departures: Number(d.departures),
      arrivals: 0,
    }));
  }

  /* ────────── GET /admin/financial/metrics ────────── */
  async getFinancialMetrics(query: {
    period?: string;
    companyId?: string;
    includeDetails?: boolean;
  }) {
    const since = this.periodToDate(query.period ?? 'month');

    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: PaymentStatus.COMPLETED });

    if (since) {
      qb.andWhere('p.created_at >= :since', { since });
    }

    const [totalResult, countResult] = await Promise.all([
      qb
        .clone()
        .select('COALESCE(SUM(p.amount), 0)', 'total')
        .getRawOne<{ total: string }>(),
      qb.clone().select('COUNT(*)', 'cnt').getRawOne<{ cnt: string }>(),
    ]);

    const totalRevenue = Number(totalResult?.total ?? 0);
    const transactionCount = Number(countResult?.cnt ?? 0);
    const avgTransactionAmount =
      transactionCount > 0 ? totalRevenue / transactionCount : 0;

    const pendingPayments = await this.paymentRepo.count({
      where: { status: PaymentStatus.PENDING },
    });

    const dailyRevenue = query.includeDetails
      ? await this.getDailyRevenue(query.period ?? 'month')
      : [];
    const paymentMethods = query.includeDetails
      ? await this.getPaymentMethodStats()
      : [];
    const topCompaniesByRevenue = query.includeDetails
      ? await this.getTopCompaniesByRevenue(5)
      : [];

    const platformFeeRate = 0.05;
    const processingFees = totalRevenue * platformFeeRate;
    const netRevenue = totalRevenue - processingFees;

    return {
      revenue: {
        total: totalRevenue,
        net: netRevenue,
        fees: processingFees,
      },
      transactions: {
        total: transactionCount,
        avgAmount: avgTransactionAmount,
      },
      dailyRevenue,
      paymentMethods,
      topCompaniesByRevenue,
      avgTransactionAmount,
      pendingPayments,
      processingFees,
      netRevenue,
      period: query.period ?? 'month',
      lastUpdated: new Date(),
      dataSource: 'live' as const,
    };
  }

  /* ────────── GET /admin/financial/daily-revenue ────────── */
  async getDailyRevenue(period: string) {
    const since = this.periodToDate(period);
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .select("TO_CHAR(p.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'revenue')
      .addSelect('COUNT(*)', 'transactions')
      .where('p.status = :status', { status: PaymentStatus.COMPLETED });

    if (since) {
      qb.andWhere('p.created_at >= :since', { since });
    }

    return qb
      .groupBy("TO_CHAR(p.created_at, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; revenue: string; transactions: string }>()
      .then((rows) =>
        rows.map((r) => ({
          date: r.date,
          revenue: Number(r.revenue),
          transactions: Number(r.transactions),
        })),
      );
  }

  /* ────────── GET /admin/financial/payment-methods ────────── */
  async getPaymentMethodStats() {
    return this.paymentRepo
      .createQueryBuilder('p')
      .select('p.method', 'method')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.status = :status', { status: PaymentStatus.COMPLETED })
      .groupBy('p.method')
      .getRawMany<{ method: string; count: string; total: string }>()
      .then((rows) =>
        rows.map((r) => ({
          method: r.method,
          count: Number(r.count),
          total: Number(r.total),
          percentage: 0,
        })),
      );
  }

  /* ────────── GET /admin/financial/top-companies ────────── */
  async getTopCompaniesByRevenue(limit: number) {
    return this.paymentRepo
      .createQueryBuilder('p')
      .select('p.operator_id', 'operatorId')
      .addSelect('o.company_name', 'companyName')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'revenue')
      .addSelect('COUNT(*)', 'totalPayments')
      .leftJoin('operators', 'o', 'o.operator_id = p.operator_id')
      .where('p.status = :status', { status: PaymentStatus.COMPLETED })
      .andWhere('p.operator_id IS NOT NULL')
      .groupBy('p.operator_id')
      .addGroupBy('o.company_name')
      .orderBy('revenue', 'DESC')
      .limit(limit)
      .getRawMany<{
        operatorId: string;
        companyName: string;
        revenue: string;
        totalPayments: string;
      }>()
      .then((rows) =>
        rows.map((r) => ({
          operatorId: r.operatorId,
          companyName: r.companyName ?? 'Unknown',
          revenue: Number(r.revenue),
          totalPayments: Number(r.totalPayments),
        })),
      );
  }

  private periodToDate(period: string): Date | null {
    const now = new Date();
    switch (period) {
      case 'today':
        now.setHours(0, 0, 0, 0);
        return now;
      case 'week':
        now.setDate(now.getDate() - 7);
        return now;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        return now;
      case 'year':
        now.setFullYear(now.getFullYear() - 1);
        return now;
      default:
        return null;
    }
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import {
  User,
  Booking,
  Trip,
  Payment,
  Operator,
  Station,
  Incident,
} from '../database/entities';

const mockQb = {
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  clone: jest.fn().mockReturnThis(),
  getCount: jest.fn().mockResolvedValue(0),
  getRawOne: jest.fn().mockResolvedValue({ total: '0', cnt: '0' }),
  getRawMany: jest.fn().mockResolvedValue([]),
};

const makeMockRepo = () => ({
  count: jest.fn().mockResolvedValue(0),
  createQueryBuilder: jest.fn().mockReturnValue({ ...mockQb }),
});

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(User), useValue: makeMockRepo() },
        { provide: getRepositoryToken(Booking), useValue: makeMockRepo() },
        { provide: getRepositoryToken(Trip), useValue: makeMockRepo() },
        { provide: getRepositoryToken(Payment), useValue: makeMockRepo() },
        { provide: getRepositoryToken(Operator), useValue: makeMockRepo() },
        { provide: getRepositoryToken(Station), useValue: makeMockRepo() },
        { provide: getRepositoryToken(Incident), useValue: makeMockRepo() },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard stats object', async () => {
      const result = await service.getDashboardStats();
      expect(result).toHaveProperty('totalCompanies');
      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('activeTrips');
      expect(result).toHaveProperty('totalBookings');
      expect(result).toHaveProperty('totalPassengers');
      expect(result).toHaveProperty('systemHealth', 100);
    });
  });

  describe('getPlatformGrowthMetrics', () => {
    it('should return growth metrics with registrations', async () => {
      const result = await service.getPlatformGrowthMetrics({
        period: 'week',
        includeStations: false,
      });
      expect(result).toHaveProperty('totalCompanies');
      expect(result).toHaveProperty('totalPassengers');
      expect(result).toHaveProperty('weeklyRegistrations');
      expect(result).toHaveProperty('growthRate');
    });

    it('should include station activities when requested', async () => {
      const result = await service.getPlatformGrowthMetrics({
        period: 'week',
        includeStations: true,
      });
      expect(result).toHaveProperty('stationActivities');
    });
  });

  describe('getFinancialMetrics', () => {
    it('should return financial metrics', async () => {
      const result = await service.getFinancialMetrics({ period: 'month' });
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('avgTransactionAmount');
      expect(result).toHaveProperty('pendingPayments');
      expect(result).toHaveProperty('dataSource', 'live');
    });
  });

  describe('getDailyRevenue', () => {
    it('should return daily revenue array', async () => {
      const result = await service.getDailyRevenue('month');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getPaymentMethodStats', () => {
    it('should return payment method stats', async () => {
      const result = await service.getPaymentMethodStats();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getTopCompaniesByRevenue', () => {
    it('should return top companies', async () => {
      const result = await service.getTopCompaniesByRevenue(5);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

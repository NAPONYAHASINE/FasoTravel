import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HeartbeatService } from './heartbeat.service';
import { CashierPresence } from '../database/entities';

const mockPresence = {
  id: 'pres-1',
  userId: 'cashier-uuid',
  stationId: 'sta-ouaga-01',
  operatorId: 'op-tsc',
  lastPingAt: new Date(),
  isOnline: true,
};

const mockPresenceRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  create: jest.fn().mockImplementation((data) => ({ id: 'pres-new', ...data })),
  save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  createQueryBuilder: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 0 }),
    getRawMany: jest.fn().mockResolvedValue([]),
  }),
};

describe('HeartbeatService', () => {
  let service: HeartbeatService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HeartbeatService,
        {
          provide: getRepositoryToken(CashierPresence),
          useValue: mockPresenceRepo,
        },
      ],
    }).compile();
    service = module.get(HeartbeatService);
  });

  describe('ping', () => {
    it('should update existing presence', async () => {
      mockPresenceRepo.findOne.mockResolvedValue({ ...mockPresence });
      const result = await service.ping(
        'cashier-uuid',
        'sta-ouaga-01',
        'op-tsc',
      );
      expect(result.isOnline).toBe(true);
      expect(mockPresenceRepo.save).toHaveBeenCalled();
    });

    it('should create new presence if not exists', async () => {
      mockPresenceRepo.findOne.mockResolvedValue(null);
      const result = await service.ping(
        'cashier-uuid',
        'sta-ouaga-01',
        'op-tsc',
      );
      expect(mockPresenceRepo.create).toHaveBeenCalled();
      expect(mockPresenceRepo.save).toHaveBeenCalled();
      expect(result.isOnline).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should mark presence as offline', async () => {
      await service.disconnect('cashier-uuid', 'sta-ouaga-01');
      expect(mockPresenceRepo.update).toHaveBeenCalledWith(
        { userId: 'cashier-uuid', stationId: 'sta-ouaga-01' },
        { isOnline: false },
      );
    });
  });

  describe('isStationOnline', () => {
    it('should return true when cashier is online', async () => {
      mockPresenceRepo.count.mockResolvedValue(1);
      const result = await service.isStationOnline('sta-ouaga-01');
      expect(result).toBe(true);
    });

    it('should return false when no cashier is online', async () => {
      mockPresenceRepo.count.mockResolvedValue(0);
      const result = await service.isStationOnline('sta-ouaga-01');
      expect(result).toBe(false);
    });
  });

  describe('getStationCashiers', () => {
    it('should return online cashiers for station', async () => {
      mockPresenceRepo.find.mockResolvedValue([{ ...mockPresence }]);
      const result = await service.getStationCashiers('sta-ouaga-01');
      expect(result).toHaveLength(1);
    });
  });

  describe('getOnlineStations', () => {
    it('should return station IDs with online cashiers', async () => {
      mockPresenceRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ stationId: 'sta-ouaga-01' }]),
      });
      const result = await service.getOnlineStations('op-tsc');
      expect(result).toContain('sta-ouaga-01');
    });
  });

  describe('markStaleOffline', () => {
    it('should mark stale presences as offline', async () => {
      mockPresenceRepo.createQueryBuilder.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 2 }),
      });
      await service.markStaleOffline();
      expect(mockPresenceRepo.createQueryBuilder).toHaveBeenCalled();
    });

    it('should do nothing when no stale presences', async () => {
      await service.markStaleOffline();
      // default mock returns affected: 0, should not log
    });
  });
});

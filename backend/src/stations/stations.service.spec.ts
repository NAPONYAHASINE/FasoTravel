import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { StationsService } from './stations.service';
import { Station, Trip, Ticket } from '../database/entities';
import { HeartbeatService } from '../heartbeat/heartbeat.service';

const mockStation = {
  id: 'sta-ouaga-01',
  name: 'Gare Routière de Ouagadougou',
  city: 'Ouagadougou',
  latitude: 12.3714,
  longitude: -1.5197,
  address: 'Avenue de la Nation',
  operatorId: null,
  amenities: ['wifi', 'parking'],
  openingHours: '06:00-22:00',
  contactPhone: '+22625000000',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockQueryBuilder = {
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[mockStation], 1]),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  having: jest.fn().mockReturnThis(),
  setParameters: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getRawAndEntities: jest.fn().mockResolvedValue({
    entities: [mockStation],
    raw: [{ distance: '2.5' }],
  }),
};

const mockRepo = {
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  findOne: jest.fn(),
  find: jest.fn().mockResolvedValue([]),
  count: jest.fn().mockResolvedValue(0),
  create: jest.fn().mockImplementation((dto) => ({ ...mockStation, ...dto })),
  save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  remove: jest.fn().mockResolvedValue(undefined),
};

const mockTripRepo = {
  find: jest.fn().mockResolvedValue([]),
  count: jest.fn().mockResolvedValue(0),
};

const mockTicketQb = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  getCount: jest.fn().mockResolvedValue(0),
  getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
};

const mockTicketRepo = {
  createQueryBuilder: jest.fn().mockReturnValue(mockTicketQb),
};

const mockHeartbeatService = {
  getStationsHeartbeatInfo: jest.fn().mockResolvedValue(new Map()),
};

describe('StationsService', () => {
  let service: StationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StationsService,
        { provide: getRepositoryToken(Station), useValue: mockRepo },
        { provide: getRepositoryToken(Trip), useValue: mockTripRepo },
        { provide: getRepositoryToken(Ticket), useValue: mockTicketRepo },
        { provide: HeartbeatService, useValue: mockHeartbeatService },
      ],
    }).compile();
    service = module.get(StationsService);
  });

  describe('findAll', () => {
    it('should return paginated stations', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 20,
        get skip() {
          return 0;
        },
      } as any);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should enrich stations with heartbeat info', async () => {
      const hbMap = new Map();
      hbMap.set('sta-ouaga-01', {
        isConnected: true,
        activeCashiers: 2,
        lastHeartbeat: new Date('2025-01-01T12:00:00Z'),
      });
      mockHeartbeatService.getStationsHeartbeatInfo.mockResolvedValue(hbMap);

      const result = await service.findAll({
        page: 1,
        limit: 20,
        get skip() {
          return 0;
        },
      } as any);
      expect(result.data[0]).toHaveProperty('isConnected', true);
      expect(result.data[0]).toHaveProperty('activeCashiers', 2);
      expect(result.data[0]).toHaveProperty('lastHeartbeat');
    });

    it('should filter by city', async () => {
      await service.findAll({
        page: 1,
        limit: 20,
        city: 'Ouagadougou',
        get skip() {
          return 0;
        },
      } as any);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(s.city) = LOWER(:city)',
        { city: 'Ouagadougou' },
      );
    });

    it('should filter by search term', async () => {
      await service.findAll({
        page: 1,
        limit: 20,
        search: 'gare',
        get skip() {
          return 0;
        },
      } as any);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(s.name) LIKE LOWER(:search) OR LOWER(s.address) LIKE LOWER(:search))',
        { search: '%gare%' },
      );
    });
  });

  describe('findNearby', () => {
    it('should return nearby stations with distance and next_departures', async () => {
      const result = await service.findNearby({
        latitude: 12.37,
        longitude: -1.52,
        radiusKm: 10,
      });
      expect(result).toHaveLength(1);
      expect(result[0].distance_km).toBe(2.5);
      expect(result[0].station).toBeDefined();
      expect(result[0].next_departures).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a station with heartbeat info', async () => {
      mockRepo.findOne.mockResolvedValue(mockStation);
      const hbMap = new Map();
      hbMap.set('sta-ouaga-01', {
        isConnected: true,
        activeCashiers: 3,
        lastHeartbeat: new Date('2025-01-01T12:00:00Z'),
      });
      mockHeartbeatService.getStationsHeartbeatInfo.mockResolvedValue(hbMap);

      const result = await service.findOne('sta-ouaga-01');
      expect(result.id).toBe('sta-ouaga-01');
      expect(result.isConnected).toBe(true);
      expect(result.activeCashiers).toBe(3);
    });

    it('should return defaults when no heartbeat for station', async () => {
      mockRepo.findOne.mockResolvedValue(mockStation);
      mockHeartbeatService.getStationsHeartbeatInfo.mockResolvedValue(
        new Map(),
      );
      const result = await service.findOne('sta-ouaga-01');
      expect(result.isConnected).toBe(false);
      expect(result.activeCashiers).toBe(0);
    });

    it('should throw NotFoundException', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('not-exist')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a station', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const dto = {
        id: 'sta-new',
        name: 'New Station',
        city: 'Bobo',
      } as any;
      const result = await service.create(dto);
      expect(result.id).toBe('sta-new');
    });

    it('should throw ConflictException for duplicate', async () => {
      mockRepo.findOne.mockResolvedValue(mockStation);
      await expect(
        service.create({
          id: 'sta-ouaga-01',
          name: 'X',
          city: 'Y',
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a station', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockStation });
      const result = await service.update('sta-ouaga-01', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should remove a station', async () => {
      mockRepo.findOne.mockResolvedValue(mockStation);
      await expect(service.remove('sta-ouaga-01')).resolves.toBeUndefined();
      expect(mockRepo.remove).toHaveBeenCalled();
    });
  });

  describe('getAllStationStats', () => {
    it('should return stats for all active stations', async () => {
      mockRepo.find.mockResolvedValue([mockStation]);
      mockTripRepo.find.mockResolvedValue([]);
      mockTripRepo.count.mockResolvedValue(0);
      const result = await service.getAllStationStats();
      expect(result).toHaveLength(1);
      expect(result[0].station_id).toBe('sta-ouaga-01');
      expect(result[0].station_name).toBe('Gare Routière de Ouagadougou');
    });
  });

  describe('getGlobalStationStats', () => {
    it('should return global stats', async () => {
      mockRepo.count.mockResolvedValue(5);
      mockRepo.find.mockResolvedValue([]);
      const result = await service.getGlobalStationStats();
      expect(result.total_stations).toBe(5);
      expect(result).toHaveProperty('active_stations');
      expect(result).toHaveProperty('total_sales_today');
    });
  });

  describe('getStationStats', () => {
    it('should return stats for a single station', async () => {
      mockRepo.findOne.mockResolvedValue(mockStation);
      mockTripRepo.find.mockResolvedValue([]);
      mockTripRepo.count.mockResolvedValue(0);
      const result = await service.getStationStats('sta-ouaga-01');
      expect(result.station_id).toBe('sta-ouaga-01');
      expect(result).toHaveProperty('sales_today');
      expect(result).toHaveProperty('revenue_today');
    });

    it('should throw NotFoundException for unknown station', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.getStationStats('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

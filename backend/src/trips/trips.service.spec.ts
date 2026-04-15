import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TripsService } from './trips.service';
import { Trip, Segment, Seat, TripSchedule } from '../database/entities';
import { SeatStatus } from '../common/constants';

const mockTrip = {
  id: 'trip-001',
  operatorId: 'op-tsc',
  operatorName: 'TSC',
  departureTime: new Date('2026-04-10T06:00:00Z'),
  arrivalTime: new Date('2026-04-10T10:00:00Z'),
  basePrice: 5000,
  currency: 'XOF',
  fromStationId: 'sta-ouaga-01',
  fromStationName: 'Ouagadougou',
  toStationId: 'sta-bobo-01',
  toStationName: 'Bobo-Dioulasso',
  availableSeats: 45,
  totalSeats: 50,
  status: 'scheduled',
  amenities: [],
};

const mockSegments = [
  {
    segmentId: 'seg-001',
    tripId: 'trip-001',
    fromStopId: 'sta-ouaga-01',
    toStopId: 'sta-bobo-01',
    departureTime: new Date(),
    arrivalTime: new Date(),
    sequenceNumber: 1,
    availableSeats: 45,
  },
];

const mockSeats = [
  {
    id: 'uuid-1',
    tripId: 'trip-001',
    seatNumber: '1A',
    status: SeatStatus.AVAILABLE,
  },
  {
    id: 'uuid-2',
    tripId: 'trip-001',
    seatNumber: '1B',
    status: SeatStatus.BOOKED,
  },
];

const mockTripQb = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([mockTrip]),
  getManyAndCount: jest.fn().mockResolvedValue([[mockTrip], 1]),
};

const mockTripRepo = {
  createQueryBuilder: jest.fn().mockReturnValue(mockTripQb),
  findOne: jest.fn(),
  create: jest.fn().mockImplementation((dto) => ({ ...mockTrip, ...dto })),
  save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
  remove: jest.fn().mockResolvedValue(undefined),
};

const mockSegmentRepo = {
  find: jest.fn().mockResolvedValue(mockSegments),
};

const mockSeatRepo = {
  find: jest.fn().mockResolvedValue(mockSeats),
};

const mockScheduleRepo = {
  find: jest.fn().mockResolvedValue([]),
};

describe('TripsService', () => {
  let service: TripsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        { provide: getRepositoryToken(Trip), useValue: mockTripRepo },
        { provide: getRepositoryToken(Segment), useValue: mockSegmentRepo },
        { provide: getRepositoryToken(Seat), useValue: mockSeatRepo },
        {
          provide: getRepositoryToken(TripSchedule),
          useValue: mockScheduleRepo,
        },
      ],
    }).compile();
    service = module.get(TripsService);
  });

  describe('search', () => {
    it('should return trips matching from/to/date', async () => {
      const result = await service.search({
        from: 'Ouagadougou',
        to: 'Bobo-Dioulasso',
        date: '2026-04-10',
        passengers: 1,
      });
      expect(result).toHaveLength(1);
      expect(mockTripQb.andWhere).toHaveBeenCalled();
    });
  });

  describe('findPopular', () => {
    it('should return popular trips', async () => {
      const result = await service.findPopular({
        page: 1,
        limit: 20,
        get skip() {
          return 0;
        },
      } as any);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return trip with segments', async () => {
      mockTripRepo.findOne.mockResolvedValue(mockTrip);
      const result = await service.findOne('trip-001');
      expect(result.id).toBe('trip-001');
      expect(result.segments).toHaveLength(1);
    });

    it('should throw NotFoundException', async () => {
      mockTripRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSeats', () => {
    it('should return seats for a trip', async () => {
      mockTripRepo.findOne.mockResolvedValue(mockTrip);
      const result = await service.getSeats('trip-001');
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException if trip missing', async () => {
      mockTripRepo.findOne.mockResolvedValue(null);
      await expect(service.getSeats('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a trip', async () => {
      mockTripRepo.findOne.mockResolvedValue(null);
      const result = await service.create({
        id: 'trip-new',
        operatorId: 'op-tsc',
        departureTime: '2026-04-10T06:00:00Z',
        arrivalTime: '2026-04-10T10:00:00Z',
        basePrice: 5000,
        fromStationId: 'sta-ouaga-01',
        toStationId: 'sta-bobo-01',
        totalSeats: 50,
      });
      expect(result.id).toBe('trip-new');
      expect(result.availableSeats).toBe(50);
    });

    it('should throw ConflictException for duplicate', async () => {
      mockTripRepo.findOne.mockResolvedValue(mockTrip);
      await expect(service.create({ id: 'trip-001' } as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update a trip', async () => {
      mockTripRepo.findOne.mockResolvedValue({ ...mockTrip });
      const result = await service.update('trip-001', { basePrice: 6000 });
      expect(result.basePrice).toBe(6000);
    });
  });

  describe('remove', () => {
    it('should remove a trip', async () => {
      mockTripRepo.findOne.mockResolvedValue(mockTrip);
      await expect(service.remove('trip-001')).resolves.toBeUndefined();
    });
  });
});

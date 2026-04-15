import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BookingsService } from './bookings.service';
import {
  Booking,
  Seat,
  Trip,
  BookingSegment,
  Segment,
} from '../database/entities';
import { TicketsService } from '../tickets/tickets.service';
import { BookingStatus, SeatStatus } from '../common/constants';

const mockTrip = {
  id: 'trip-001',
  operatorId: 'op-tsc',
  basePrice: 5000,
  currency: 'XOF',
  fromStationId: 'sta-ouaga-01',
  toStationId: 'sta-bobo-01',
  availableSeats: 45,
  totalSeats: 50,
  status: 'scheduled',
};

const mockSeat1 = {
  id: 'sid-1',
  tripId: 'trip-001',
  seatNumber: '1A',
  status: SeatStatus.AVAILABLE,
  bookedByUserId: null,
  bookedByBookingId: null,
  holdExpiresAt: null,
};

const mockSeat2 = {
  id: 'sid-2',
  tripId: 'trip-001',
  seatNumber: '1B',
  status: SeatStatus.AVAILABLE,
  bookedByUserId: null,
  bookedByBookingId: null,
  holdExpiresAt: null,
};

const mockSegments: Partial<Segment>[] = [
  {
    segmentId: 'seg-1',
    tripId: 'trip-001',
    fromStopId: 'sta-ouaga-01',
    toStopId: 'sta-koudougou-01',
    sequenceNumber: 1,
    availableSeats: 45,
    totalSeats: 50,
    basePrice: 3000,
    status: 'SCHEDULED',
  },
  {
    segmentId: 'seg-2',
    tripId: 'trip-001',
    fromStopId: 'sta-koudougou-01',
    toStopId: 'sta-bobo-01',
    sequenceNumber: 2,
    availableSeats: 50,
    totalSeats: 50,
    basePrice: 4000,
    status: 'SCHEDULED',
  },
];

const userId = 'user-uuid-123';

const mockBooking = {
  id: 'bk-uuid-1',
  userId,
  tripId: 'trip-001',
  operatorId: 'op-tsc',
  status: BookingStatus.PENDING,
  totalAmount: 10000,
  currency: 'XOF',
  numPassengers: 2,
  holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
  createdAt: new Date(),
};

// Transaction manager mock
const mockManager = {
  findOne: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([{ ...mockSeat1 }, { ...mockSeat2 }]),
  }),
  create: jest.fn().mockImplementation((_Entity, data) => ({
    id: 'bk-uuid-1',
    ...data,
  })),
  save: jest
    .fn()
    .mockImplementation((_Entity, entity) =>
      Promise.resolve(Array.isArray(entity) ? entity : entity),
    ),
  remove: jest.fn().mockResolvedValue(undefined),
};

const mockDataSource = {
  transaction: jest
    .fn()
    .mockImplementation(
      (cb: (manager: typeof mockManager) => Promise<unknown>) =>
        cb(mockManager),
    ),
};

const mockBookingRepo = {
  findOne: jest.fn(),
  findAndCount: jest.fn().mockResolvedValue([[mockBooking], 1]),
  save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
  find: jest.fn().mockResolvedValue([]),
  count: jest.fn().mockResolvedValue(0),
};

const mockSeatRepo = {
  update: jest.fn().mockResolvedValue({ affected: 2 }),
  find: jest.fn(),
};

const mockTripRepo = {};
const mockBookingSegmentRepo = {
  count: jest.fn().mockResolvedValue(0),
  find: jest.fn().mockResolvedValue([]),
};

const mockTicketsService = {
  generateForBooking: jest.fn().mockResolvedValue([]),
};

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
        { provide: getRepositoryToken(Seat), useValue: mockSeatRepo },
        { provide: getRepositoryToken(Trip), useValue: mockTripRepo },
        {
          provide: getRepositoryToken(BookingSegment),
          useValue: mockBookingSegmentRepo,
        },
        { provide: DataSource, useValue: mockDataSource },
        { provide: TicketsService, useValue: mockTicketsService },
      ],
    }).compile();
    service = module.get(BookingsService);
  });

  // ─── Trip-level bookings (no segments) ───

  describe('create (trip-level, no segments)', () => {
    beforeEach(() => {
      // No segments → trip-level path
      mockManager.find.mockResolvedValue([]);
    });

    it('should create a PENDING booking and lock seats', async () => {
      mockManager.findOne.mockResolvedValue(mockTrip);
      const result = await service.create(userId, {
        tripId: 'trip-001',
        seatNumbers: ['1A', '1B'],
      });
      expect(result.status).toBe(BookingStatus.PENDING);
      expect(result.id).toBe('bk-uuid-1');
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if trip not found', async () => {
      mockManager.findOne.mockResolvedValue(null);
      await expect(
        service.create(userId, { tripId: 'nope', seatNumbers: ['1A'] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if seats already taken', async () => {
      mockManager.findOne.mockResolvedValue(mockTrip);
      mockManager.createQueryBuilder.mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([{ ...mockSeat1, status: SeatStatus.HELD }]),
      });
      await expect(
        service.create(userId, { tripId: 'trip-001', seatNumbers: ['1A'] }),
      ).rejects.toThrow(ConflictException);
    });

    it('should auto-assign seats when numSeats is provided without seatNumbers', async () => {
      mockManager.findOne.mockResolvedValue(mockTrip);
      mockManager.find.mockResolvedValue([]); // no segments → trip-level

      // First createQueryBuilder call: auto-assign query (numSeats)
      // Second: lock seats query
      mockManager.createQueryBuilder
        .mockReturnValueOnce({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([
            { ...mockSeat1, seatNumber: '1A' },
            { ...mockSeat2, seatNumber: '1B' },
          ]),
        })
        .mockReturnValueOnce({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest
            .fn()
            .mockResolvedValue([{ ...mockSeat1 }, { ...mockSeat2 }]),
        });

      const result = await service.create(userId, {
        tripId: 'trip-001',
        numSeats: 2,
      });
      expect(result.status).toBe(BookingStatus.PENDING);
    });

    it('should throw BadRequestException if neither seatNumbers nor numSeats provided', async () => {
      await expect(
        service.create(userId, { tripId: 'trip-001' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if not enough seats for numSeats', async () => {
      mockManager.findOne.mockResolvedValue(mockTrip);
      mockManager.find.mockResolvedValue([]); // no segments

      mockManager.createQueryBuilder.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([{ ...mockSeat1, seatNumber: '1A' }]),
      });

      await expect(
        service.create(userId, { tripId: 'trip-001', numSeats: 5 }),
      ).rejects.toThrow(ConflictException);
    });

    it('should store passengerName and passengerPhone in bookingFor', async () => {
      mockManager.findOne.mockResolvedValue(mockTrip);
      mockManager.find.mockResolvedValue([]); // no segments
      mockManager.createQueryBuilder.mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ ...mockSeat1 }]),
      });

      const result = await service.create(userId, {
        tripId: 'trip-001',
        seatNumbers: ['1A'],
        passengerName: 'Amadou Ouedraogo',
        passengerPhone: '+22670112233',
      });
      expect(result.bookingFor).toEqual({
        name: 'Amadou Ouedraogo',
        phone: '+22670112233',
      });
    });

    it('should use unitPrice override when provided', async () => {
      mockManager.findOne.mockResolvedValue(mockTrip);
      mockManager.find.mockResolvedValue([]); // no segments
      mockManager.createQueryBuilder.mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ ...mockSeat1 }]),
      });

      const result = await service.create(userId, {
        tripId: 'trip-001',
        seatNumbers: ['1A'],
        unitPrice: 3000,
      });
      expect(result.totalAmount).toBe(3000);
    });

    it('should store selectedServices in booking', async () => {
      mockManager.findOne.mockResolvedValue(mockTrip);
      mockManager.find.mockResolvedValue([]); // no segments
      mockManager.createQueryBuilder.mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ ...mockSeat1 }]),
      });

      const result = await service.create(userId, {
        tripId: 'trip-001',
        seatNumbers: ['1A'],
        selectedServices: ['wifi', 'meal'],
      });
      expect(result.selectedServices).toEqual(['wifi', 'meal']);
    });
  });

  // ─── Segment-based bookings ───

  describe('create (segment-based)', () => {
    it('should create booking with BookingSegment records', async () => {
      mockManager.findOne.mockResolvedValue(mockTrip);
      // find(Segment) returns segments
      mockManager.find.mockResolvedValue(mockSegments.map((s) => ({ ...s })));
      // createQueryBuilder for seats + second call for conflict check
      mockManager.createQueryBuilder
        .mockReturnValueOnce({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest
            .fn()
            .mockResolvedValue([{ ...mockSeat1 }, { ...mockSeat2 }]),
        })
        .mockReturnValueOnce({
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        });

      const result = await service.create(userId, {
        tripId: 'trip-001',
        seatNumbers: ['1A', '1B'],
        boardingStationId: 'sta-ouaga-01',
        alightingStationId: 'sta-bobo-01',
      });

      expect(result.status).toBe(BookingStatus.PENDING);
      // BookingSegment records should be saved (2 seats × 2 segments = 4)
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if seat is taken on overlapping segment', async () => {
      mockManager.findOne.mockResolvedValue(mockTrip);
      mockManager.find.mockResolvedValue(mockSegments.map((s) => ({ ...s })));
      mockManager.createQueryBuilder
        .mockReturnValueOnce({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([{ ...mockSeat1 }]),
        })
        .mockReturnValueOnce({
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest
            .fn()
            .mockResolvedValue([
              { seatId: 'sid-1', segmentId: 'seg-1', bookingId: 'bk-other' },
            ]),
        });

      await expect(
        service.create(userId, {
          tripId: 'trip-001',
          seatNumbers: ['1A'],
          boardingStationId: 'sta-ouaga-01',
          alightingStationId: 'sta-bobo-01',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid station range', async () => {
      mockManager.findOne.mockResolvedValue(mockTrip);
      mockManager.find.mockResolvedValue(mockSegments.map((s) => ({ ...s })));

      await expect(
        service.create(userId, {
          tripId: 'trip-001',
          seatNumbers: ['1A'],
          boardingStationId: 'sta-invalid',
          alightingStationId: 'sta-bobo-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirm', () => {
    it('should confirm a PENDING booking and generate tickets', async () => {
      mockBookingRepo.findOne.mockResolvedValue({ ...mockBooking });
      mockBookingSegmentRepo.count.mockResolvedValue(0);
      const result = await service.confirm('bk-uuid-1', userId);
      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(mockTicketsService.generateForBooking).toHaveBeenCalled();
      expect(mockSeatRepo.update).toHaveBeenCalled();
    });

    it('should confirm segment-based booking without updating seats', async () => {
      mockBookingRepo.findOne.mockResolvedValue({ ...mockBooking });
      mockBookingSegmentRepo.count.mockResolvedValue(4);
      const result = await service.confirm('bk-uuid-1', userId);
      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(mockSeatRepo.update).not.toHaveBeenCalled();
    });

    it('should throw if booking not found', async () => {
      mockBookingRepo.findOne.mockResolvedValue(null);
      await expect(service.confirm('nope', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if already confirmed', async () => {
      mockBookingRepo.findOne.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });
      await expect(service.confirm('bk-uuid-1', userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if hold expired', async () => {
      mockBookingRepo.findOne.mockResolvedValue({
        ...mockBooking,
        holdExpiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.confirm('bk-uuid-1', userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancel (trip-level)', () => {
    it('should cancel booking and release seats', async () => {
      mockManager.findOne
        .mockResolvedValueOnce({ ...mockBooking })
        .mockResolvedValueOnce({ ...mockTrip, availableSeats: 43 });
      mockManager.find
        .mockResolvedValueOnce([]) // find BookingSegment → none (trip-level)
        .mockResolvedValueOnce([
          { ...mockSeat1, status: SeatStatus.HELD },
          { ...mockSeat2, status: SeatStatus.HELD },
        ]); // find Seat
      const result = await service.cancel('bk-uuid-1', userId);
      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw if booking not found', async () => {
      mockManager.findOne.mockResolvedValue(null);
      await expect(service.cancel('nope', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if already cancelled', async () => {
      mockManager.findOne.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });
      await expect(service.cancel('bk-uuid-1', userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancel (segment-based)', () => {
    it('should cancel segment booking and restore segment available seats', async () => {
      mockManager.findOne.mockResolvedValue({ ...mockBooking });
      mockManager.find
        .mockResolvedValueOnce([
          { bookingId: 'bk-uuid-1', segmentId: 'seg-1', seatId: 'sid-1' },
          { bookingId: 'bk-uuid-1', segmentId: 'seg-2', seatId: 'sid-1' },
        ]) // find BookingSegment
        .mockResolvedValueOnce([
          { ...mockSegments[0], availableSeats: 44 },
          { ...mockSegments[1], availableSeats: 49 },
        ]); // find Segment
      const result = await service.cancel('bk-uuid-1', userId);
      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(mockManager.remove).toHaveBeenCalled();
    });
  });

  describe('findMyBookings', () => {
    it('should return paginated bookings', async () => {
      const result = await service.findMyBookings(userId, {
        page: 1,
        limit: 20,
        get skip() {
          return 0;
        },
      } as any);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('expireHolds', () => {
    it('should expire old PENDING bookings (trip-level)', async () => {
      const expiredBooking = {
        ...mockBooking,
        holdExpiresAt: new Date(Date.now() - 60000),
      };
      mockBookingRepo.find.mockResolvedValue([expiredBooking]);
      mockManager.find
        .mockResolvedValueOnce([]) // find BookingSegment → none
        .mockResolvedValueOnce([{ ...mockSeat1, status: SeatStatus.HELD }]); // find Seat
      mockManager.findOne.mockResolvedValue(mockTrip);

      await service.expireHolds();
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should expire segment-based bookings', async () => {
      const expiredBooking = {
        ...mockBooking,
        holdExpiresAt: new Date(Date.now() - 60000),
      };
      mockBookingRepo.find.mockResolvedValue([expiredBooking]);
      mockManager.find
        .mockResolvedValueOnce([
          { bookingId: 'bk-uuid-1', segmentId: 'seg-1', seatId: 'sid-1' },
        ]) // find BookingSegment → segments exist
        .mockResolvedValueOnce([{ ...mockSegments[0], availableSeats: 44 }]); // find Segment

      await service.expireHolds();
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockManager.remove).toHaveBeenCalled();
    });

    it('should do nothing if no expired bookings', async () => {
      mockBookingRepo.find.mockResolvedValue([]);
      await service.expireHolds();
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });
  });
});

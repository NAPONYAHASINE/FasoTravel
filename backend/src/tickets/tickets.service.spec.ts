import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import {
  Ticket,
  TicketTransfer,
  Booking,
  Seat,
  User,
} from '../database/entities';
import { TicketStatus, BookingStatus } from '../common/constants';

// Mock qrcode before import
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockQR'),
}));

const userId = 'user-uuid-123';

const now = new Date();
const pastDate = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
const futureDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour ahead

const mockBooking = {
  id: 'bk-uuid-1',
  userId,
  tripId: 'trip-001',
  operatorId: 'op-tsc',
  status: BookingStatus.CONFIRMED,
  totalAmount: 10000,
  numPassengers: 2,
  bookingFor: [
    { name: 'Amadou', phone: '+22670111222', seatNumber: '1A' },
    { name: 'Fatou', phone: '+22670333444', seatNumber: '1B' },
  ],
};

const mockSeats = [
  { id: 'sid-1', seatNumber: '1A', bookedByBookingId: 'bk-uuid-1' },
  { id: 'sid-2', seatNumber: '1B', bookedByBookingId: 'bk-uuid-1' },
];

const mockTicket = {
  id: 'TKT-TEST-001',
  tripId: 'trip-001',
  bookingId: 'bk-uuid-1',
  operatorId: 'op-tsc',
  passengerName: 'Amadou',
  seatNumber: '1A',
  status: TicketStatus.ACTIVE,
  qrCode: 'data:image/png;base64,...',
  alphanumericCode: 'FT-AB12CD34',
  price: 5000,
  purchasedByUserId: userId,
  isTransferred: false,
};

const mockTicketRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn().mockResolvedValue([[mockTicket], 1]),
  create: jest.fn().mockImplementation((dto) => ({ ...mockTicket, ...dto })),
  save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
};

const mockTransferRepo = {
  create: jest.fn().mockImplementation((dto) => ({
    transferId: 'tr-uuid-1',
    ...dto,
  })),
  save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
};

const mockBookingRepo = {};

const mockSeatRepo = {
  find: jest.fn().mockResolvedValue(mockSeats),
};

const mockUserRepo = {
  findOne: jest.fn(),
};

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: getRepositoryToken(Ticket), useValue: mockTicketRepo },
        {
          provide: getRepositoryToken(TicketTransfer),
          useValue: mockTransferRepo,
        },
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
        { provide: getRepositoryToken(Seat), useValue: mockSeatRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();
    service = module.get(TicketsService);
  });

  describe('generateForBooking', () => {
    it('should generate 1 ticket per seat', async () => {
      const tickets = await service.generateForBooking(mockBooking as any);
      expect(tickets).toHaveLength(2);
      expect(mockTicketRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should generate QR code and alphanumeric code', async () => {
      const tickets = await service.generateForBooking(mockBooking as any);
      expect(tickets[0].qrCode).toBeDefined();
      expect(tickets[0].alphanumericCode).toBeDefined();
      expect(tickets[0].alphanumericCode).toMatch(/^FT-/);
    });

    it('should use passenger info from booking', async () => {
      const tickets = await service.generateForBooking(mockBooking as any);
      expect(tickets[0].passengerName).toBe('Amadou');
      expect(tickets[1].passengerName).toBe('Fatou');
    });
  });

  describe('findMyTickets', () => {
    it('should return paginated tickets', async () => {
      const result = await service.findMyTickets(userId, {
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
    it('should return a ticket', async () => {
      mockTicketRepo.findOne.mockResolvedValue(mockTicket);
      const result = await service.findOne('TKT-TEST-001');
      expect(result.id).toBe('TKT-TEST-001');
    });

    it('should throw NotFoundException', async () => {
      mockTicketRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyByCode', () => {
    it('should find ticket by alphanumeric code', async () => {
      mockTicketRepo.findOne.mockResolvedValue(mockTicket);
      const result = await service.verifyByCode('FT-AB12CD34');
      expect(result.alphanumericCode).toBe('FT-AB12CD34');
    });

    it('should throw if code not found', async () => {
      mockTicketRepo.findOne.mockResolvedValue(null);
      await expect(service.verifyByCode('INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('consumeDepartedTickets', () => {
    it('should consume tickets whose trip has departed', async () => {
      const activeTicket: Record<string, unknown> = {
        ...mockTicket,
        status: TicketStatus.ACTIVE,
        trip: { departureTime: pastDate },
      };
      mockTicketRepo.find.mockResolvedValue([activeTicket]);
      mockTicketRepo.save.mockImplementation((e: unknown) =>
        Promise.resolve(e),
      );

      await service.consumeDepartedTickets();

      expect(activeTicket.status).toBe(TicketStatus.BOARDED);
      expect(activeTicket.boardedAt).toBeDefined();
      expect(mockTicketRepo.save).toHaveBeenCalled();
    });

    it('should NOT consume tickets whose trip has not departed yet', async () => {
      const futureTicket = {
        ...mockTicket,
        status: TicketStatus.ACTIVE,
        trip: { departureTime: futureDate },
      };
      mockTicketRepo.find.mockResolvedValue([futureTicket]);

      await service.consumeDepartedTickets();

      expect(futureTicket.status).toBe(TicketStatus.ACTIVE);
    });

    it('should do nothing when no active tickets', async () => {
      mockTicketRepo.find.mockResolvedValue([]);
      await service.consumeDepartedTickets();
      expect(mockTicketRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('transfer', () => {
    it('should create a transfer', async () => {
      mockTicketRepo.findOne.mockResolvedValue({ ...mockTicket });
      mockUserRepo.findOne.mockResolvedValue({
        id: 'recipient-uuid',
        name: 'Recipient',
        phoneNumber: '+22670999888',
      });
      const result = await service.transfer('TKT-TEST-001', userId, {
        recipientPhone: '+22670999888',
      });
      expect(result.fromUserId).toBe(userId);
      expect(result.toUserId).toBe('recipient-uuid');
    });

    it('should throw if not the owner', async () => {
      mockTicketRepo.findOne.mockResolvedValue({
        ...mockTicket,
        purchasedByUserId: 'other-user',
      });
      await expect(
        service.transfer('TKT-TEST-001', userId, {
          recipientPhone: '+22670999888',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if ticket not ACTIVE', async () => {
      mockTicketRepo.findOne.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.CANCELLED,
      });
      await expect(
        service.transfer('TKT-TEST-001', userId, {
          recipientPhone: '+22670999888',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if already transferred', async () => {
      mockTicketRepo.findOne.mockResolvedValue({
        ...mockTicket,
        isTransferred: true,
      });
      await expect(
        service.transfer('TKT-TEST-001', userId, {
          recipientPhone: '+22670999888',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});

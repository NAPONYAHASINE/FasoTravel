import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SocieteService } from './societe.service';
import {
  User,
  UserOperatorRole,
  Route,
  TripSchedule,
  Trip,
  Ticket,
  PriceSegment,
  PriceHistory,
  CashTransaction,
} from '../database/entities';

describe('SocieteService', () => {
  let service: SocieteService;
  let userRepo: Record<string, jest.Mock>;
  let roleRepo: Record<string, jest.Mock>;
  let routeRepo: Record<string, jest.Mock>;
  let scheduleRepo: Record<string, jest.Mock>;
  let tripRepo: Record<string, jest.Mock>;
  let ticketRepo: Record<string, jest.Mock>;
  let priceSegmentRepo: Record<string, jest.Mock>;
  let priceHistoryRepo: Record<string, jest.Mock>;
  let cashTxRepo: Record<string, jest.Mock>;

  const operatorId = 'op-001';
  const userId = 'usr-001';

  const mockUser: Partial<User> = {
    id: userId,
    firstName: 'Moussa',
    lastName: 'Ouedraogo',
    name: 'Moussa Ouedraogo',
    email: 'moussa@test.com',
    phoneNumber: '+22670000000',
    status: 'active',
  };

  const mockRole: Partial<UserOperatorRole> = {
    userId,
    operatorId,
    role: 'MANAGER',
    isActive: true,
    user: mockUser as User,
  };

  const mockRoute: Partial<Route> = {
    id: 'route-001',
    createdAt: new Date(),
  };

  const mockSchedule: Partial<TripSchedule> = {
    scheduleId: 'sched-001',
    operatorId,
    fromStopId: 'st-a',
    toStopId: 'st-b',
    departureTime: '08:00',
    basePrice: 5000,
    durationMinutes: 180,
    vehicleId: 'v-001',
  };

  const mockTrip: Partial<Trip> = {
    id: 'trip-001',
    operatorId,
    status: 'scheduled',
    departureTime: new Date(),
  };

  const mockTicket: Partial<Ticket> = {
    id: 'TKT-ABC12345',
    tripId: 'trip-001',
    operatorId,
    status: 'confirmed',
    price: 5000,
    alphanumericCode: 'ABC12345',
    salesChannel: 'guichet',
  };

  const mockSegment: Partial<PriceSegment> = {
    id: 'seg-001',
    operatorId,
    price: 5000,
    label: 'Ouaga-Bobo',
    isActive: true,
  };

  const mockHistory: Partial<PriceHistory> = {
    id: 'hist-001',
    segmentId: 'seg-001',
    oldPrice: 5000,
    newPrice: 6000,
    changedAt: new Date(),
  };

  beforeEach(async () => {
    const createQb = (data: any[] = []) => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(data),
    });

    userRepo = {
      findOneBy: jest.fn(),
      create: jest.fn((e: any) => e),
      save: jest.fn((e: any) => Promise.resolve({ id: userId, ...e })),
    };

    roleRepo = {
      find: jest.fn().mockResolvedValue([mockRole]),
      findOne: jest.fn().mockResolvedValue(mockRole),
      findOneBy: jest.fn(),
      create: jest.fn((e: any) => e),
      save: jest.fn((e: any) => Promise.resolve(e)),
    };

    routeRepo = {
      find: jest.fn().mockResolvedValue([mockRoute]),
      findOneBy: jest.fn().mockResolvedValue(mockRoute),
      create: jest.fn((e: any) => e),
      save: jest.fn((e: any) => Promise.resolve(e)),
      remove: jest.fn(),
    };

    scheduleRepo = {
      find: jest.fn().mockResolvedValue([mockSchedule]),
      findOneBy: jest.fn().mockResolvedValue(mockSchedule),
      create: jest.fn((e: any) => e),
      save: jest.fn((e: any) => Promise.resolve(e)),
      remove: jest.fn(),
    };

    tripRepo = {
      find: jest.fn().mockResolvedValue([mockTrip]),
      createQueryBuilder: jest.fn(() => createQb([mockTrip])),
      create: jest.fn((e: any) => e),
      save: jest.fn((e: any) => Promise.resolve(e)),
    };

    ticketRepo = {
      findOneBy: jest.fn().mockResolvedValue(mockTicket),
      createQueryBuilder: jest.fn(() => createQb([mockTicket])),
      create: jest.fn((e: any) => e),
      save: jest.fn((e: any) => Promise.resolve({ ...mockTicket, ...e })),
    };

    priceSegmentRepo = {
      find: jest.fn().mockResolvedValue([mockSegment]),
      findOneBy: jest.fn().mockResolvedValue(mockSegment),
      save: jest.fn((e: any) => Promise.resolve(e)),
    };

    priceHistoryRepo = {
      find: jest.fn().mockResolvedValue([mockHistory]),
      create: jest.fn((e: any) => e),
      save: jest.fn((e: any) => Promise.resolve(e)),
    };

    cashTxRepo = {
      createQueryBuilder: jest.fn(() => createQb([])),
      create: jest.fn((e: any) => e),
      save: jest.fn((e: any) => Promise.resolve(e)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocieteService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(UserOperatorRole), useValue: roleRepo },
        { provide: getRepositoryToken(Route), useValue: routeRepo },
        { provide: getRepositoryToken(TripSchedule), useValue: scheduleRepo },
        { provide: getRepositoryToken(Trip), useValue: tripRepo },
        { provide: getRepositoryToken(Ticket), useValue: ticketRepo },
        {
          provide: getRepositoryToken(PriceSegment),
          useValue: priceSegmentRepo,
        },
        {
          provide: getRepositoryToken(PriceHistory),
          useValue: priceHistoryRepo,
        },
        { provide: getRepositoryToken(CashTransaction), useValue: cashTxRepo },
      ],
    }).compile();

    service = module.get<SocieteService>(SocieteService);
  });

  // ═══════ MANAGERS ═══════

  it('getManagers returns staff list', async () => {
    const result = await service.getManagers(operatorId);
    expect(roleRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ operatorId }),
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('moussa@test.com');
  });

  it('getManagerById returns staff', async () => {
    const result = await service.getManagerById(operatorId, userId);
    expect(result.id).toBe(userId);
  });

  it('getManagerById throws when not found', async () => {
    roleRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.getManagerById(operatorId, 'x')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('createManager creates new user and role', async () => {
    userRepo.findOneBy.mockResolvedValueOnce(null);
    const dto = {
      firstName: 'Awa',
      lastName: 'Traore',
      email: 'awa@test.com',
    };
    const result = await service.createManager(operatorId, dto as any);
    expect(userRepo.create).toHaveBeenCalled();
    expect(userRepo.save).toHaveBeenCalled();
    expect(roleRepo.create).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('createManager assigns role if user exists', async () => {
    userRepo.findOneBy.mockResolvedValueOnce(mockUser);
    roleRepo.findOneBy.mockResolvedValueOnce(null);
    const dto = {
      firstName: 'Moussa',
      lastName: 'Ouedraogo',
      email: 'moussa@test.com',
    };
    await service.createManager(operatorId, dto as any);
    expect(roleRepo.create).toHaveBeenCalled();
  });

  it('createManager throws if role already exists', async () => {
    userRepo.findOneBy.mockResolvedValueOnce(mockUser);
    roleRepo.findOneBy.mockResolvedValueOnce(mockRole);
    const dto = { firstName: 'A', lastName: 'B', email: 'moussa@test.com' };
    await expect(service.createManager(operatorId, dto as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('updateManager updates staff details', async () => {
    const dto = { firstName: 'Updated' };
    const result = await service.updateManager(operatorId, userId, dto as any);
    expect(userRepo.save).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('deleteManager soft-disables role', async () => {
    await service.deleteManager(operatorId, userId);
    expect(roleRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
  });

  // ═══════ CASHIERS ═══════

  it('getCashiers returns cashier list', async () => {
    const result = await service.getCashiers(operatorId);
    expect(result).toHaveLength(1);
  });

  it('getCashierById throws when not found', async () => {
    roleRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.getCashierById(operatorId, 'x')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ═══════ ROUTES ═══════

  it('getRoutes returns list', async () => {
    const result = await service.getRoutes(operatorId);
    expect(result).toEqual([mockRoute]);
  });

  it('getRouteById returns route', async () => {
    const result = await service.getRouteById('route-001');
    expect(result).toEqual(mockRoute);
  });

  it('getRouteById throws when not found', async () => {
    routeRepo.findOneBy.mockResolvedValueOnce(null);
    await expect(service.getRouteById('x')).rejects.toThrow(NotFoundException);
  });

  it('createRoute creates with generated id', async () => {
    const dto = {
      fromStationId: 'st-1',
      toStationId: 'st-2',
      name: 'Ouaga-Bobo',
    };
    await service.createRoute(dto);
    expect(routeRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ouaga-Bobo' }),
    );
    expect(routeRepo.save).toHaveBeenCalled();
  });

  it('updateRoute merges dto', async () => {
    await service.updateRoute('route-001', { name: 'New Name' });
    expect(routeRepo.save).toHaveBeenCalled();
  });

  it('deleteRoute removes', async () => {
    await service.deleteRoute('route-001');
    expect(routeRepo.remove).toHaveBeenCalled();
  });

  // ═══════ SCHEDULE TEMPLATES ═══════

  it('getScheduleTemplates returns list', async () => {
    const result = await service.getScheduleTemplates(operatorId);
    expect(result).toEqual([mockSchedule]);
  });

  it('getScheduleTemplateById returns template', async () => {
    const result = await service.getScheduleTemplateById('sched-001');
    expect(result).toEqual(mockSchedule);
  });

  it('getScheduleTemplateById throws when not found', async () => {
    scheduleRepo.findOneBy.mockResolvedValueOnce(null);
    await expect(service.getScheduleTemplateById('x')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('createScheduleTemplate creates', async () => {
    await service.createScheduleTemplate(operatorId, {
      departureTime: '10:00',
    });
    expect(scheduleRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ operatorId }),
    );
  });

  it('deleteScheduleTemplate removes', async () => {
    await service.deleteScheduleTemplate('sched-001');
    expect(scheduleRepo.remove).toHaveBeenCalled();
  });

  // ═══════ TRIPS ═══════

  it('getTrips uses query builder with filters', async () => {
    const result = await service.getTrips(operatorId, {
      routeId: 'r-1',
      status: 'scheduled',
    });
    expect(tripRepo.createQueryBuilder).toHaveBeenCalledWith('t');
    expect(result).toEqual([mockTrip]);
  });

  it('generateTripsFromTemplates creates trips from schedules', async () => {
    const result = await service.generateTripsFromTemplates(operatorId, {
      date: '2026-01-15',
    });
    expect(scheduleRepo.find).toHaveBeenCalled();
    expect(tripRepo.create).toHaveBeenCalled();
    expect(tripRepo.save).toHaveBeenCalled();
    expect(result.generated).toBe(1);
    expect(result.date).toBe('2026-01-15');
  });

  // ═══════ TICKETS ═══════

  it('createTicketCashSale creates ticket and cash tx', async () => {
    const dto = {
      tripId: 'trip-001',
      passengerName: 'Ali Diallo',
      passengerPhone: '+22670111111',
      seatNumber: '5',
      price: 5000,
    };
    const result = await service.createTicketCashSale(
      operatorId,
      'cashier-001',
      dto,
    );
    expect(ticketRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        operatorId,
        salesChannel: 'guichet',
        status: 'confirmed',
      }),
    );
    expect(cashTxRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'sale' }),
    );
    expect(result).toBeDefined();
  });

  it('getSocieteTickets queries by operator', async () => {
    const result = await service.getSocieteTickets(operatorId, {});
    expect(ticketRepo.createQueryBuilder).toHaveBeenCalled();
    expect(result).toEqual([mockTicket]);
  });

  it('updateTicket updates fields', async () => {
    await service.updateTicket('TKT-001', { seatNumber: '10' });
    expect(ticketRepo.save).toHaveBeenCalled();
  });

  it('updateTicket throws when not found', async () => {
    ticketRepo.findOneBy.mockResolvedValueOnce(null);
    await expect(service.updateTicket('x', {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('cancelTicket sets status cancelled', async () => {
    await service.cancelTicket('TKT-001');
    expect(ticketRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'cancelled' }),
    );
  });

  it('refundTicket sets status refunded and records tx', async () => {
    await service.refundTicket('TKT-001', operatorId, 5000, 'c-001');
    expect(ticketRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'refunded' }),
    );
    expect(cashTxRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'refund', amount: -5000 }),
    );
  });

  // ═══════ PRICE SEGMENTS ═══════

  it('getPriceSegments returns active segments', async () => {
    const result = await service.getPriceSegments(operatorId);
    expect(result).toEqual([mockSegment]);
  });

  it('updatePriceSegment records history and updates price', async () => {
    const result = await service.updatePriceSegment('seg-001', 6000, 'admin');
    expect(priceHistoryRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        segmentId: 'seg-001',
        oldPrice: 5000,
        newPrice: 6000,
      }),
    );
    expect(priceSegmentRepo.save).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('updatePriceSegment throws when not found', async () => {
    priceSegmentRepo.findOneBy.mockResolvedValueOnce(null);
    await expect(service.updatePriceSegment('x', 100)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('getPriceHistory returns history list', async () => {
    const result = await service.getPriceHistory('seg-001');
    expect(result).toEqual([mockHistory]);
  });

  // ═══════ CASH TRANSACTIONS ═══════

  it('getCashTransactions uses query builder', async () => {
    await service.getCashTransactions(operatorId, { cashierId: 'c-1' });
    expect(cashTxRepo.createQueryBuilder).toHaveBeenCalledWith('ct');
  });

  it('createCashTransaction creates tx', async () => {
    await service.createCashTransaction(operatorId, 'c-001', {
      type: 'adjustment',
      amount: 1000,
    });
    expect(cashTxRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ operatorId, cashierId: 'c-001' }),
    );
    expect(cashTxRepo.save).toHaveBeenCalled();
  });
});

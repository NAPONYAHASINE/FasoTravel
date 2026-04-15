import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SupportService } from './support.service';
import { SupportTicket, User } from '../database/entities';

describe('SupportService', () => {
  let service: SupportService;

  const mockTicketRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ id: 'ticket1', ...d })),
    createQueryBuilder: jest.fn(() => ({
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'ticket1' }], 1]),
    })),
  };

  const mockUserRepo = {
    findOneBy: jest.fn().mockResolvedValue({
      userId: 'u1',
      firstName: 'Moussa',
      lastName: 'Diarra',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        {
          provide: getRepositoryToken(SupportTicket),
          useValue: mockTicketRepo,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get(SupportService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ========== ADMIN ==========

  it('findAll returns paginated tickets', async () => {
    const result = await service.findAll({ page: 1, limit: 20 } as any);
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('findAll with status filter', async () => {
    const qb = mockTicketRepo.createQueryBuilder();
    mockTicketRepo.createQueryBuilder.mockReturnValue(qb);
    await service.findAll({ page: 1, limit: 20, status: 'open' } as any);
    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('findOne returns ticket', async () => {
    const ticket = { id: 'ticket1', subject: 'Help' };
    mockTicketRepo.findOneBy.mockResolvedValue(ticket);
    const result = await service.findOne('ticket1');
    expect(result.subject).toBe('Help');
  });

  it('findOne throws when not found', async () => {
    mockTicketRepo.findOneBy.mockResolvedValue(null);
    await expect(service.findOne('nope')).rejects.toThrow(
      'Support ticket not found',
    );
  });

  it('assign updates assignedTo and status', async () => {
    const ticket = { id: 'ticket1', assignedTo: null, status: 'open' };
    mockTicketRepo.findOneBy.mockResolvedValue(ticket);
    mockTicketRepo.save.mockResolvedValue({
      ...ticket,
      assignedTo: 'admin1',
      status: 'in-progress',
    });
    const result = await service.assign('ticket1', { adminId: 'admin1' });
    expect(result.status).toBe('in-progress');
    expect(result.assignedTo).toBe('admin1');
  });

  it('resolve sets status and resolution', async () => {
    const ticket = {
      id: 'ticket1',
      status: 'open',
      resolution: null,
      resolvedAt: null,
    };
    mockTicketRepo.findOneBy.mockResolvedValue(ticket);
    mockTicketRepo.save.mockResolvedValue({
      ...ticket,
      status: 'resolved',
      resolution: 'Fixed',
    });
    const result = await service.resolve('ticket1', { resolution: 'Fixed' });
    expect(result.status).toBe('resolved');
    expect(result.resolution).toBe('Fixed');
  });

  it('updatePriority changes priority', async () => {
    const ticket = { id: 'ticket1', priority: 'medium' };
    mockTicketRepo.findOneBy.mockResolvedValue(ticket);
    mockTicketRepo.save.mockResolvedValue({ ...ticket, priority: 'urgent' });
    const result = await service.updatePriority('ticket1', {
      priority: 'urgent',
    });
    expect(result.priority).toBe('urgent');
  });

  it('updateStatus changes status', async () => {
    const ticket = { id: 'ticket1', status: 'open', resolvedAt: null };
    mockTicketRepo.findOneBy.mockResolvedValue(ticket);
    mockTicketRepo.save.mockResolvedValue({ ...ticket, status: 'closed' });
    const result = await service.updateStatus('ticket1', { status: 'closed' });
    expect(result.status).toBe('closed');
  });

  it('addReply appends reply to ticket', async () => {
    const ticket = { id: 'ticket1', replies: [] };
    mockTicketRepo.findOneBy.mockResolvedValue(ticket);
    mockTicketRepo.save.mockImplementation((d) => Promise.resolve(d));
    const result = await service.addReply('ticket1', {
      authorId: 'admin1',
      authorName: 'Admin',
      authorRole: 'admin',
      message: 'We are looking into it',
    });
    expect(result.replies).toHaveLength(1);
    expect(result.replies[0].message).toBe('We are looking into it');
  });

  // ========== MOBILE ==========

  it('createFromMobile creates a ticket', async () => {
    const result = await service.createFromMobile('u1', {
      subject: 'Help',
      message: 'I need help',
      category: 'BOOKING',
    });
    expect(result.subject).toBe('Help');
    expect(result.userName).toBe('Moussa Diarra');
    expect(mockTicketRepo.save).toHaveBeenCalled();
  });

  it('getMyTickets returns user tickets', async () => {
    const list = [{ id: 'ticket1', userId: 'u1' }];
    mockTicketRepo.find.mockResolvedValue(list);
    const result = await service.getMyTickets('u1');
    expect(result).toEqual(list);
  });
});

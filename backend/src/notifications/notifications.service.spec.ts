import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import {
  Notification,
  NotificationTemplate,
  AutomationRule,
  NotificationCampaign,
  ScheduledNotification,
  User,
  UserDevice,
} from '../database/entities';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockNotificationRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ notificationId: 'n1', ...d })),
    remove: jest.fn(),
    countBy: jest.fn().mockResolvedValue(3),
    createQueryBuilder: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 2 }),
    })),
  };

  const mockTemplateRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOneBy: jest.fn(),
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ id: 'tpl1', ...d })),
    remove: jest.fn(),
    count: jest.fn().mockResolvedValue(5),
  };

  const mockAutomationRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOneBy: jest.fn(),
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ id: 'auto1', ...d })),
    remove: jest.fn(),
  };

  const mockCampaignRepo = {
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ id: 'camp1', ...d })),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '10' }),
    })),
  };

  const mockScheduledRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOneBy: jest.fn(),
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ id: 'sch1', ...d })),
    countBy: jest.fn().mockResolvedValue(2),
  };

  const mockUserRepo = {
    countBy: jest.fn().mockResolvedValue(100),
  };

  const mockUserDeviceRepo = {
    findOne: jest.fn(),
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ id: 'dev1', ...d })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepo,
        },
        {
          provide: getRepositoryToken(NotificationTemplate),
          useValue: mockTemplateRepo,
        },
        {
          provide: getRepositoryToken(AutomationRule),
          useValue: mockAutomationRepo,
        },
        {
          provide: getRepositoryToken(NotificationCampaign),
          useValue: mockCampaignRepo,
        },
        {
          provide: getRepositoryToken(ScheduledNotification),
          useValue: mockScheduledRepo,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        {
          provide: getRepositoryToken(UserDevice),
          useValue: mockUserDeviceRepo,
        },
      ],
    }).compile();

    service = module.get(NotificationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ========== ADMIN INBOX ==========

  it('getAdminNotifications returns list', async () => {
    const list = [{ notificationId: 'n1' }];
    mockNotificationRepo.find.mockResolvedValue(list);
    const result = await service.getAdminNotifications();
    expect(result).toEqual(list);
  });

  it('markAsRead updates notification', async () => {
    const notif = { notificationId: 'n1', isRead: false, readAt: null };
    mockNotificationRepo.findOneBy.mockResolvedValue(notif);
    mockNotificationRepo.save.mockResolvedValue({ ...notif, isRead: true });
    const result = await service.markAsRead('n1');
    expect(result.isRead).toBe(true);
  });

  // ========== BULK SEND ==========

  it('sendBulk with scheduledAt creates scheduled', async () => {
    mockUserRepo.countBy.mockResolvedValue(50);
    const result = await service.sendBulk({
      title: 'Test',
      message: 'Hello',
      channels: ['push'],
      audience: 'all_passengers',
      scheduledAt: '2026-05-01T10:00:00Z',
    });
    expect(result.scheduledAt).toBe('2026-05-01T10:00:00Z');
    expect(mockScheduledRepo.save).toHaveBeenCalled();
  });

  it('sendBulk without scheduledAt sends immediately', async () => {
    mockUserRepo.countBy.mockResolvedValue(100);
    const result = await service.sendBulk({
      title: 'Test',
      message: 'Hello',
      channels: ['push'],
      audience: 'all_passengers',
    });
    expect(result.sentCount).toBe(100);
    expect(mockCampaignRepo.save).toHaveBeenCalled();
  });

  // ========== STATS ==========

  it('getStats returns aggregated data', async () => {
    const result = await service.getStats();
    expect(result).toHaveProperty('totalSent');
    expect(result).toHaveProperty('scheduledCount');
    expect(result).toHaveProperty('templatesCount');
    expect(result).toHaveProperty('trends');
  });

  it('getAudienceSegments returns segments', async () => {
    mockUserRepo.countBy.mockResolvedValueOnce(200).mockResolvedValueOnce(150);
    const result = await service.getAudienceSegments();
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result[0].value).toBe('all_passengers');
  });

  // ========== AUTOMATION RULES ==========

  it('createAutomationRule creates and returns rule', async () => {
    const dto = {
      name: 'Welcome',
      triggerEvent: 'user_registered',
      template: { title: 'Bienvenue', message: 'Bonjour!' },
      channels: ['push'],
      category: 'onboarding',
    };
    const result = await service.createAutomationRule(dto);
    expect(result.name).toBe('Welcome');
    expect(mockAutomationRepo.save).toHaveBeenCalled();
  });

  it('updateAutomationRule updates existing rule', async () => {
    const rule = { id: 'auto1', name: 'Old', isActive: true };
    mockAutomationRepo.findOneBy.mockResolvedValue(rule);
    mockAutomationRepo.save.mockResolvedValue({ ...rule, name: 'New' });
    const result = await service.updateAutomationRule('auto1', { name: 'New' });
    expect(result.name).toBe('New');
  });

  it('deleteAutomationRule removes rule', async () => {
    mockAutomationRepo.findOneBy.mockResolvedValue({ id: 'auto1' });
    await service.deleteAutomationRule('auto1');
    expect(mockAutomationRepo.remove).toHaveBeenCalled();
  });

  // ========== TEMPLATES ==========

  it('createTemplate creates and returns template', async () => {
    const dto = {
      name: 'Welcome',
      title: 'Hi',
      message: 'Hello',
      category: 'onboarding',
    };
    const result = await service.createTemplate(dto);
    expect(result.name).toBe('Welcome');
    expect(mockTemplateRepo.save).toHaveBeenCalled();
  });

  it('useTemplate increments usage count', async () => {
    const tpl = { id: 'tpl1', usageCount: 5, lastUsed: null };
    mockTemplateRepo.findOneBy.mockResolvedValue(tpl);
    mockTemplateRepo.save.mockResolvedValue({ ...tpl, usageCount: 6 });
    const result = await service.useTemplate('tpl1');
    expect(result.usageCount).toBe(6);
  });

  // ========== SCHEDULED ==========

  it('cancelScheduled sets status to cancelled', async () => {
    const sch = { id: 'sch1', status: 'pending' };
    mockScheduledRepo.findOneBy.mockResolvedValue(sch);
    mockScheduledRepo.save.mockResolvedValue({ ...sch, status: 'cancelled' });
    const result = await service.cancelScheduled('sch1');
    expect(result.status).toBe('cancelled');
  });

  // ========== MOBILE ==========

  it('getUserNotifications returns user notifications', async () => {
    const list = [{ notificationId: 'n1', userId: 'u1' }];
    mockNotificationRepo.find.mockResolvedValue(list);
    const result = await service.getUserNotifications('u1');
    expect(result).toEqual(list);
  });

  it('markAllUserNotificationsAsRead bulk updates', async () => {
    const result = await service.markAllUserNotificationsAsRead('u1');
    expect(result.success).toBe(true);
  });

  it('getUnreadCount returns count', async () => {
    mockNotificationRepo.countBy.mockResolvedValue(7);
    const result = await service.getUnreadCount('u1');
    expect(result.count).toBe(7);
  });
});

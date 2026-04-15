import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { SecurityService } from './security.service';
import {
  User,
  UserSession,
  SecurityEvent,
  BlockedIp,
} from '../database/entities';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock'),
}));

const mockUser = {
  id: 'user-uuid-1',
  email: 'admin@fasotravel.com',
  name: 'Admin',
  passwordHash: 'hashed-password',
  mfaEnabled: false,
  mfaSecret: null,
  mfaBackupCodes: null,
  updatedAt: new Date(),
};

const mockSession = {
  sessionId: 'session-uuid-1',
  userId: 'user-uuid-1',
  deviceType: 'web',
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0',
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 86400000),
  lastActiveAt: new Date(),
  user: { name: 'Admin', role: 'SUPER_ADMIN' },
};

const mockUserRepo = {
  findOne: jest.fn(),
  save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
};

const mockSessionRepo = {
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  findAndCount: jest.fn().mockResolvedValue([[], 0]),
  count: jest.fn().mockResolvedValue(0),
  remove: jest.fn().mockResolvedValue({}),
  createQueryBuilder: jest.fn().mockReturnValue({
    delete: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 0 }),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  }),
};

const mockEventRepo = {
  find: jest.fn().mockResolvedValue([]),
  findAndCount: jest.fn().mockResolvedValue([[], 0]),
  create: jest.fn().mockImplementation((d) => d),
  save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
};

const mockBlockedIpRepo = {
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  create: jest.fn().mockImplementation((d) => d),
  save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
  remove: jest.fn().mockResolvedValue({}),
};

describe('SecurityService', () => {
  let service: SecurityService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        {
          provide: getRepositoryToken(UserSession),
          useValue: mockSessionRepo,
        },
        {
          provide: getRepositoryToken(SecurityEvent),
          useValue: mockEventRepo,
        },
        {
          provide: getRepositoryToken(BlockedIp),
          useValue: mockBlockedIpRepo,
        },
      ],
    }).compile();

    service = module.get(SecurityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSecurityProfile', () => {
    it('should return security profile', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser });
      const result = await service.getSecurityProfile('user-uuid-1');
      expect(result).toHaveProperty('twoFactorEnabled', false);
      expect(result).toHaveProperty('activeSessions');
      expect(result).toHaveProperty('recentEvents');
    });

    it('should throw NotFoundException if user missing', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.getSecurityProfile('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('changePassword', () => {
    it('should change password with correct current password', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      await service.changePassword('user-uuid-1', 'old', 'newpass123');
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(mockEventRepo.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException with wrong password', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('user-uuid-1', 'wrong', 'new'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('initiate2FA', () => {
    it('should return QR code and backup codes', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser });

      const result = await service.initiate2FA('user-uuid-1');
      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCodeUrl');
      expect(result).toHaveProperty('backupCodes');
      expect(result.backupCodes).toHaveLength(10);
    });

    it('should throw if 2FA already enabled', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
      });

      await expect(service.initiate2FA('user-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('disable2FA', () => {
    it('should disable 2FA', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
      });

      await service.disable2FA('user-uuid-1');
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should throw if 2FA not enabled', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser });

      await expect(service.disable2FA('user-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getActiveSessions', () => {
    it('should return user sessions', async () => {
      mockSessionRepo.find.mockResolvedValue([mockSession]);
      const result = await service.getActiveSessions('user-uuid-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('ipAddress');
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session', async () => {
      mockSessionRepo.findOne.mockResolvedValue(mockSession);
      await service.revokeSession('user-uuid-1', 'session-uuid-1');
      expect(mockSessionRepo.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException', async () => {
      mockSessionRepo.findOne.mockResolvedValue(null);
      await expect(
        service.revokeSession('user-uuid-1', 'nope'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('revokeAllOtherSessions', () => {
    it('should revoke all other sessions', async () => {
      const result = await service.revokeAllOtherSessions(
        'user-uuid-1',
        'current-session',
      );
      expect(result).toHaveProperty('count');
    });
  });

  describe('getSecurityEvents', () => {
    it('should return paginated security events', async () => {
      const result = await service.getSecurityEvents('user-uuid-1');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
    });
  });

  /* ─── Platform sessions ─── */

  describe('getAllSessions', () => {
    it('should return paginated sessions', async () => {
      const result = await service.getAllSessions({ page: 1, limit: 20 });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
    });
  });

  describe('getSessionStats', () => {
    it('should return session stats', async () => {
      const result = await service.getSessionStats();
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('active');
      expect(result).toHaveProperty('inactive');
      expect(result).toHaveProperty('blockedIps');
    });
  });

  describe('terminateSession', () => {
    it('should terminate a session', async () => {
      mockSessionRepo.findOne.mockResolvedValue(mockSession);
      await service.terminateSession('session-uuid-1');
      expect(mockSessionRepo.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException', async () => {
      mockSessionRepo.findOne.mockResolvedValue(null);
      await expect(service.terminateSession('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('terminateBulk', () => {
    it('should terminate multiple sessions', async () => {
      mockSessionRepo.findOne.mockResolvedValue(mockSession);
      const result = await service.terminateBulk(['s1', 's2']);
      expect(result).toHaveProperty('count', 2);
    });
  });

  describe('terminateByUser', () => {
    it('should terminate all sessions for a user', async () => {
      const result = await service.terminateByUser('user-uuid-1');
      expect(result).toHaveProperty('count');
    });
  });

  describe('blockIp', () => {
    it('should block an IP', async () => {
      mockBlockedIpRepo.findOne.mockResolvedValue(null);
      const result = await service.blockIp('192.168.1.1', 'Suspicious');
      expect(result).toHaveProperty('count');
      expect(mockBlockedIpRepo.save).toHaveBeenCalled();
    });

    it('should throw if IP already blocked', async () => {
      mockBlockedIpRepo.findOne.mockResolvedValue({ ipAddress: '192.168.1.1' });
      await expect(service.blockIp('192.168.1.1', 'reason')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getBlockedIps', () => {
    it('should return blocked IPs', async () => {
      mockBlockedIpRepo.find.mockResolvedValue([{ ipAddress: '10.0.0.1' }]);
      const result = await service.getBlockedIps();
      expect(result).toEqual(['10.0.0.1']);
    });
  });

  describe('unblockIp', () => {
    it('should unblock an IP', async () => {
      mockBlockedIpRepo.findOne.mockResolvedValue({
        ipAddress: '10.0.0.1',
      });
      await service.unblockIp('10.0.0.1');
      expect(mockBlockedIpRepo.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException', async () => {
      mockBlockedIpRepo.findOne.mockResolvedValue(null);
      await expect(service.unblockIp('10.0.0.1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

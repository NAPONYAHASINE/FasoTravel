import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, Notification } from '../database/entities';
import { UserRole, UserStatus } from '../common/constants';

const mockUser = {
  id: 'user-uuid-1',
  name: 'Test Passenger',
  email: 'test@example.com',
  phoneNumber: '+22670000000',
  role: UserRole.PASSENGER,
  status: UserStatus.ACTIVE,
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  profileImageUrl: null,
  referralCode: 'FT-226ABC',
  referralPointsBalance: 50,
  badgeLevel: 'standard',
  firstName: null,
  lastName: null,
  passwordHash: 'hashed',
};

const mockUserRepo = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  }),
};

const mockNotifRepo = {
  create: jest.fn().mockImplementation((d) => d),
  save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotifRepo,
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPassengers', () => {
    it('should return paginated passengers', async () => {
      mockUserRepo.findAndCount.mockResolvedValue([[mockUser], 1]);

      const result = await service.findPassengers({
        page: 1,
        limit: 20,
        get skip() {
          return 0;
        },
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe('user-uuid-1');
    });

    it('should search passengers by name', async () => {
      const result = await service.findPassengers({
        page: 1,
        limit: 20,
        search: 'Test',
        get skip() {
          return 0;
        },
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
    });
  });

  describe('findPassengerById', () => {
    it('should return a passenger', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      const result = await service.findPassengerById('user-uuid-1');
      expect(result.id).toBe('user-uuid-1');
      expect(result.name).toBe('Test Passenger');
    });

    it('should throw NotFoundException', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.findPassengerById('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePassenger', () => {
    it('should update passenger fields', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser });
      mockUserRepo.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.updatePassenger('user-uuid-1', {
        name: 'Updated',
      });

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException if not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updatePassenger('nope', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('suspendPassenger', () => {
    it('should suspend an active passenger', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser });
      mockUserRepo.save.mockResolvedValue({});

      await service.suspendPassenger('user-uuid-1', 'Bad behavior');
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should throw if already suspended', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        status: UserStatus.SUSPENDED,
      });

      await expect(
        service.suspendPassenger('user-uuid-1', 'reason'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reactivatePassenger', () => {
    it('should reactivate a suspended passenger', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        status: UserStatus.SUSPENDED,
      });
      mockUserRepo.save.mockResolvedValue({});

      await service.reactivatePassenger('user-uuid-1');
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should throw if already active', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser });

      await expect(service.reactivatePassenger('user-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyPassenger', () => {
    it('should verify a passenger', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        isVerified: false,
      });
      mockUserRepo.save.mockResolvedValue({});

      await service.verifyPassenger('user-uuid-1');
      expect(mockUserRepo.save).toHaveBeenCalled();
    });
  });

  describe('deletePassenger', () => {
    it('should delete a passenger', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.remove.mockResolvedValue({});

      await service.deletePassenger('user-uuid-1');
      expect(mockUserRepo.remove).toHaveBeenCalled();
    });

    it('should throw if not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.deletePassenger('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('sendNotification', () => {
    it('should create notification for passenger', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      await service.sendNotification('user-uuid-1', {
        title: 'Hello',
        message: 'Test',
      });

      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-1',
          title: 'Hello',
          message: 'Test',
        }),
      );
      expect(mockNotifRepo.save).toHaveBeenCalled();
    });
  });

  describe('resetPassengerPassword', () => {
    it('should return temporary password', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser });
      mockUserRepo.save.mockResolvedValue({});

      const result = await service.resetPassengerPassword('user-uuid-1');
      expect(result).toHaveProperty('temporaryPassword');
      expect(typeof result.temporaryPassword).toBe('string');
    });
  });
});

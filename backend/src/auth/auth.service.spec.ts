import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../database/entities';
import { UserRole, UserStatus } from '../common/constants';
import { IntegrationsService } from '../integrations/integrations.service';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Partial user factory
const createMockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'test-uuid-123',
    email: 'test@example.com',
    phoneNumber: '+22670000000',
    firstName: 'Test',
    lastName: 'User',
    name: 'Test User',
    role: UserRole.PASSENGER,
    isVerified: false,
    status: UserStatus.ACTIVE,
    otpCode: null,
    otpExpiresAt: null,
    refreshToken: null,
    passwordHash: null,
    referralCode: 'FTABC1234',
    lastLoginAt: null,
    ...overrides,
  }) as User;

describe('AuthService', () => {
  let service: AuthService;
  let mockRepo: Record<string, jest.Mock>;
  let mockJwtService: Record<string, jest.Mock>;
  let mockConfigService: Record<string, jest.Mock>;
  let mockIntegrationsService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn(),
      create: jest.fn((data) => ({ ...createMockUser(), ...data })),
      save: jest.fn((user) => Promise.resolve(user)),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-token'),
      verify: jest
        .fn()
        .mockReturnValue({ sub: 'test-uuid-123', role: 'passenger' }),
    };

    mockConfigService = {
      get: jest.fn((key: string, fallback?: string) => {
        const map: Record<string, string> = {
          NODE_ENV: 'development',
          'jwt.secret': 'test-secret',
          'jwt.refreshSecret': 'test-refresh-secret',
          'jwt.expiresIn': '1h',
          'jwt.refreshExpiresIn': '30d',
        };
        return map[key] ?? fallback;
      }),
      getOrThrow: jest.fn((key: string) => {
        const map: Record<string, string> = {
          'jwt.secret': 'test-secret',
          'jwt.refreshSecret': 'test-refresh-secret',
        };
        const val = map[key];
        if (!val) throw new Error(`Missing config: ${key}`);
        return val;
      }),
    };

    mockIntegrationsService = {
      sendOtpViaWhatsApp: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: IntegrationsService, useValue: mockIntegrationsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ─── Register ───

  describe('register', () => {
    it('should register a new user and return token immediately', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.register({
        email: 'new@example.com',
        password: 'Test1234',
        firstName: 'New',
        lastName: 'User',
      });

      expect(result.token).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(result.user).toBeDefined();
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already registered', async () => {
      mockRepo.findOne.mockResolvedValue(createMockUser());

      await expect(
        service.register({ email: 'test@example.com', password: 'Test1234' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── Login ───

  describe('login', () => {
    it('should return otpRequired for non-admin (PASSENGER) with valid credentials', async () => {
      const hashed = await bcrypt.hash('Test1234', 12);
      mockRepo.findOne.mockResolvedValue(
        createMockUser({ passwordHash: hashed, role: UserRole.PASSENGER }),
      );

      const result = await service.login({
        email: 'test@example.com',
        password: 'Test1234',
      });

      expect((result as any).otpRequired).toBe(true);
      expect((result as any).identifier).toBe('test@example.com');
      expect((result as any).otpCode).toBeDefined();
      expect(mockIntegrationsService.sendOtpViaWhatsApp).toHaveBeenCalled();
    });

    it('should return token immediately for admin role', async () => {
      const hashed = await bcrypt.hash('Admin1234', 12);
      mockRepo.findOne.mockResolvedValue(
        createMockUser({ passwordHash: hashed, role: UserRole.SUPER_ADMIN }),
      );

      const result = await service.login({
        email: 'admin@example.com',
        password: 'Admin1234',
      });

      expect((result as any).token).toBe('mock-token');
      expect((result as any).refreshToken).toBe('mock-token');
      expect((result as any).user).toBeDefined();
      expect((result as any).otpRequired).toBeUndefined();
    });

    it('should send OTP via WhatsApp using phone number from email pattern', async () => {
      const hashed = await bcrypt.hash('Test1234', 12);
      mockRepo.findOne.mockResolvedValue(
        createMockUser({ passwordHash: hashed, phoneNumber: undefined as any }),
      );

      await service.login({
        email: '70123456@phone.transportbf.bf',
        password: 'Test1234',
      });

      expect(mockIntegrationsService.sendOtpViaWhatsApp).toHaveBeenCalledWith(
        '70123456',
        expect.any(String),
      );
    });

    it('should find société user by phoneNumber when using synthetic email', async () => {
      const hashed = await bcrypt.hash('Test1234', 12);
      mockRepo.findOne.mockResolvedValue(
        createMockUser({
          email: 'manager@company.bf',
          phoneNumber: '70000002',
          passwordHash: hashed,
          role: 'manager',
        }),
      );

      const result = await service.login({
        email: '70000002@phone.transportbf.bf',
        password: 'Test1234',
      });

      expect((result as any).otpRequired).toBe(true);
      // Should search with OR condition [email, phoneNumber]
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: [
          { email: '70000002@phone.transportbf.bf' },
          { phoneNumber: '70000002' },
        ],
      });
      expect(mockIntegrationsService.sendOtpViaWhatsApp).toHaveBeenCalledWith(
        '70000002',
        expect.any(String),
      );
    });

    it('should throw if email not registered', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@email.com', password: 'Test1234' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if account is suspended', async () => {
      mockRepo.findOne.mockResolvedValue(
        createMockUser({ status: UserStatus.SUSPENDED }),
      );

      await expect(
        service.login({ email: 'test@example.com', password: 'Test1234' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if password is wrong', async () => {
      const hashed = await bcrypt.hash('CorrectPass', 12);
      mockRepo.findOne.mockResolvedValue(
        createMockUser({ passwordHash: hashed }),
      );

      await expect(
        service.login({ email: 'test@example.com', password: 'WrongPass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── Verify OTP ───

  describe('verifyOtp', () => {
    it('should verify valid OTP and return tokens', async () => {
      const user = createMockUser({
        otpCode: '123456',
        otpExpiresAt: new Date(Date.now() + 600_000),
      });
      mockRepo.findOne.mockResolvedValue(user);

      const result = await service.verifyOtp({
        email: 'test@example.com',
        code: '123456',
      });

      expect(result.token).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(result.user).toBeDefined();
    });

    it('should throw if no OTP was requested', async () => {
      mockRepo.findOne.mockResolvedValue(createMockUser());

      await expect(
        service.verifyOtp({
          email: 'test@example.com',
          code: '123456',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if OTP expired', async () => {
      mockRepo.findOne.mockResolvedValue(
        createMockUser({
          otpCode: '123456',
          otpExpiresAt: new Date(Date.now() - 1000),
        }),
      );

      await expect(
        service.verifyOtp({
          email: 'test@example.com',
          code: '123456',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if OTP is wrong', async () => {
      mockRepo.findOne.mockResolvedValue(
        createMockUser({
          otpCode: '123456',
          otpExpiresAt: new Date(Date.now() + 600_000),
        }),
      );

      await expect(
        service.verifyOtp({
          email: 'test@example.com',
          code: '999999',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should find user by phoneNumber when verifying OTP with synthetic email', async () => {
      const user = createMockUser({
        email: 'manager@company.bf',
        phoneNumber: '70000002',
        otpCode: '654321',
        otpExpiresAt: new Date(Date.now() + 600_000),
      });
      mockRepo.findOne.mockResolvedValue(user);

      const result = await service.verifyOtp({
        identifier: '70000002@phone.transportbf.bf',
        code: '654321',
      });

      expect(result.token).toBeDefined();
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: [
          { email: '70000002@phone.transportbf.bf' },
          { phoneNumber: '70000002' },
        ],
      });
    });
  });

  // ─── Refresh Token ───

  describe('refreshToken', () => {
    it('should return new tokens for valid refresh', async () => {
      const hashed = await bcrypt.hash('valid-refresh', 12);
      mockRepo.findOne.mockResolvedValue(
        createMockUser({ refreshToken: hashed }),
      );

      const result = await service.refreshToken({
        refreshToken: 'valid-refresh',
      });

      expect(result.token).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });

    it('should throw if user not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.refreshToken({ refreshToken: 'bad-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── Get Me ───

  describe('getMe', () => {
    it('should return sanitized user', async () => {
      mockRepo.findOne.mockResolvedValue(createMockUser());

      const result = await service.getMe('test-uuid-123');

      expect(result).toBeDefined();
      expect((result as any).passwordHash).toBeUndefined();
      expect((result as any).otpCode).toBeUndefined();
    });

    it('should throw if user not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.getMe('nonexistent')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── Logout ───

  describe('logout', () => {
    it('should clear refresh token', async () => {
      const result = await service.logout('test-uuid-123');

      expect(result.message).toContain('Logged out');
      expect(mockRepo.update).toHaveBeenCalled();
    });
  });

  // ─── Resend OTP ───

  describe('resendOtp', () => {
    it('should resend OTP via WhatsApp for non-admin', async () => {
      mockRepo.findOne.mockResolvedValue(
        createMockUser({ role: UserRole.PASSENGER }),
      );

      const result = await service.resendOtp({ email: 'test@example.com' });

      expect(result.message).toContain('WhatsApp');
      expect(result.otpCode).toBeDefined();
      expect(mockIntegrationsService.sendOtpViaWhatsApp).toHaveBeenCalled();
    });

    it('should resend OTP via email for admin', async () => {
      mockRepo.findOne.mockResolvedValue(
        createMockUser({ role: UserRole.SUPER_ADMIN }),
      );

      const result = await service.resendOtp({ email: 'admin@example.com' });

      expect(result.message).toContain('email');
      expect(mockIntegrationsService.sendOtpViaWhatsApp).not.toHaveBeenCalled();
    });

    it('should not reveal if user does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.resendOtp({ email: 'unknown@example.com' });

      expect(result.message).toBeDefined();
    });
  });

  // ─── Forgot Password ───

  describe('forgotPassword', () => {
    it('should send OTP for existing user', async () => {
      mockRepo.findOne.mockResolvedValue(createMockUser());

      const result = await service.forgotPassword({
        email: 'test@example.com',
      });

      expect(result.message).toContain('OTP');
      expect(result.otpCode).toBeDefined();
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should not reveal if user does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword({
        email: 'unknown@example.com',
      });

      expect(result.message).toContain('OTP');
      expect(result.otpCode).toBeUndefined();
    });
  });

  // ─── Reset Password ───

  describe('resetPassword', () => {
    it('should reset password with valid OTP', async () => {
      mockRepo.findOne.mockResolvedValue(
        createMockUser({
          otpCode: '123456',
          otpExpiresAt: new Date(Date.now() + 600_000),
        }),
      );

      const result = await service.resetPassword({
        email: 'test@example.com',
        code: '123456',
        newPassword: 'NewPass123',
      });

      expect(result.message).toContain('reset successfully');
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should throw if no OTP was requested', async () => {
      mockRepo.findOne.mockResolvedValue(createMockUser());

      await expect(
        service.resetPassword({
          email: 'test@example.com',
          code: '123456',
          newPassword: 'NewPass123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if OTP is wrong', async () => {
      mockRepo.findOne.mockResolvedValue(
        createMockUser({
          otpCode: '123456',
          otpExpiresAt: new Date(Date.now() + 600_000),
        }),
      );

      await expect(
        service.resetPassword({
          email: 'test@example.com',
          code: '999999',
          newPassword: 'NewPass123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

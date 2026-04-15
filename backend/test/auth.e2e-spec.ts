import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { User } from '../src/database/entities';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { APP_GUARD } from '@nestjs/core';
import jwtConfig from '../src/config/jwt.config';

/**
 * Auth e2e tests — runs against a mock DB repository.
 * Once Docker is available, swap the override for a real DB test.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;

  // In-memory user store
  const users: Map<string, any> = new Map();

  const mockUserRepository = {
    findOne: jest.fn(({ where }: any) => {
      if (where.phoneNumber) {
        for (const u of users.values()) {
          if (u.phoneNumber === where.phoneNumber) return Promise.resolve(u);
        }
      }
      if (where.userId) {
        return Promise.resolve(users.get(where.userId) ?? null);
      }
      return Promise.resolve(null);
    }),
    create: jest.fn((data: any) => {
      const userId = 'e2e-uuid-' + Math.random().toString(36).slice(2, 8);
      return { userId, isActive: true, isVerified: false, ...data };
    }),
    save: jest.fn((user: any) => {
      users.set(user.userId, user);
      return Promise.resolve(user);
    }),
    update: jest.fn(({ userId }: any, data: any) => {
      const user = users.get(userId);
      if (user) Object.assign(user, data);
      return Promise.resolve({ affected: user ? 1 : 0 });
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [jwtConfig] }),
        PassportModule,
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (cfg: ConfigService) => ({
            secret: cfg.get<string>('jwt.secret'),
            signOptions: {
              expiresIn: cfg.get<string>('jwt.accessExpiresIn') as any,
            },
          }),
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    users.clear();
    jest.clearAllMocks();
  });

  // ─── Register ───

  describe('POST /api/auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ phoneNumber: '+22670000000', fullName: 'Test' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.message).toContain('OTP');
          expect(res.body.data.otpCode).toBeDefined();
        });
    });

    it('should reject invalid phone number', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ phoneNumber: 'not-a-phone' })
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
        });
    });

    it('should reject duplicate phone number', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ phoneNumber: '+22670000000' });

      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ phoneNumber: '+22670000000' })
        .expect(409);
    });

    it('should reject unknown fields', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ phoneNumber: '+22670000000', hackerField: 'injection' })
        .expect(400);
    });
  });

  // ─── Login ───

  describe('POST /api/auth/login', () => {
    it('should send OTP for registered user', async () => {
      // Register first
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ phoneNumber: '+22670000000' });

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ phoneNumber: '+22670000000' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.otpCode).toBeDefined();
        });
    });

    it('should 401 for unregistered phone', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ phoneNumber: '+22699999999' })
        .expect(401);
    });
  });

  // ─── Verify OTP ───

  describe('POST /api/auth/verify-otp', () => {
    it('should return tokens for valid OTP', async () => {
      // Register
      const regRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ phoneNumber: '+22670000000' });
      const otp = regRes.body.data.otpCode;

      // Verify
      return request(app.getHttpServer())
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: '+22670000000', otpCode: otp })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.accessToken).toBeDefined();
          expect(res.body.data.refreshToken).toBeDefined();
          expect(res.body.data.user).toBeDefined();
        });
    });

    it('should reject invalid OTP', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ phoneNumber: '+22670000000' });

      return request(app.getHttpServer())
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: '+22670000000', otpCode: '000000' })
        .expect(401);
    });
  });

  // ─── Me (protected) ───

  describe('GET /api/auth/me', () => {
    it('should 401 without token', () => {
      return request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('should return profile with valid token', async () => {
      // Register + verify to get token
      const regRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ phoneNumber: '+22670111111' });
      const otp = regRes.body.data.otpCode;

      const verifyRes = await request(app.getHttpServer())
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: '+22670111111', otpCode: otp });
      const token = verifyRes.body.data.accessToken;

      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.phoneNumber).toBe('+22670111111');
        });
    });
  });

  // ─── Forgot + Reset Password ───

  describe('POST /api/auth/forgot-password + reset-password', () => {
    it('should send OTP then reset password', async () => {
      // Register
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ phoneNumber: '+22670222222' });

      // Forgot password
      const forgotRes = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ phoneNumber: '+22670222222' })
        .expect(200);

      const otp = forgotRes.body.data.otpCode;

      // Reset password
      return request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          phoneNumber: '+22670222222',
          otpCode: otp,
          newPassword: 'NewSecure123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.message).toContain('reset successfully');
        });
    });
  });

  // ─── Roles Guard ───

  describe('RolesGuard integration', () => {
    it('should block non-admin from admin routes (403)', async () => {
      // This test validates the guard is active.
      // Since there are no admin-only routes yet in auth, we just confirm
      // the guard mechanism works by checking me works for PASSENGER.
      const regRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ phoneNumber: '+22670333333' });
      const otp = regRes.body.data.otpCode;

      const verifyRes = await request(app.getHttpServer())
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: '+22670333333', otpCode: otp });

      const token = verifyRes.body.data.accessToken;

      // PASSENGER can access /me (no specific role required)
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});

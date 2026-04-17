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
import { IntegrationsService } from '../src/integrations/integrations.service';
import { APP_GUARD } from '@nestjs/core';
import jwtConfig from '../src/config/jwt.config';

/**
 * Auth e2e tests — runs against a mock DB repository.
 * Uses email + password auth flow (current API).
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;

  // In-memory user store
  const users: Map<string, any> = new Map();

  const mockUserRepository = {
    findOne: jest.fn(({ where }: any) => {
      // Handle array of where conditions (OR)
      const conditions = Array.isArray(where) ? where : [where];
      for (const cond of conditions) {
        if (cond.email) {
          for (const u of users.values()) {
            if (u.email === cond.email) return Promise.resolve(u);
          }
        }
        if (cond.phoneNumber) {
          for (const u of users.values()) {
            if (u.phoneNumber === cond.phoneNumber) return Promise.resolve(u);
          }
        }
        if (cond.userId || cond.id) {
          const id = cond.userId || cond.id;
          return Promise.resolve(users.get(id) ?? null);
        }
        if (cond.referralCode) {
          for (const u of users.values()) {
            if (u.referralCode === cond.referralCode) return Promise.resolve(u);
          }
        }
      }
      return Promise.resolve(null);
    }),
    create: jest.fn((data: any) => {
      const id = 'e2e-uuid-' + Math.random().toString(36).slice(2, 8);
      return {
        id,
        userId: id,
        isActive: true,
        isVerified: false,
        status: 'active',
        ...data,
      };
    }),
    save: jest.fn((user: any) => {
      users.set(user.id || user.userId, user);
      return Promise.resolve(user);
    }),
    update: jest.fn(({ userId, id }: any, data: any) => {
      const user = users.get(userId || id);
      if (user) Object.assign(user, data);
      return Promise.resolve({ affected: user ? 1 : 0 });
    }),
    increment: jest.fn().mockResolvedValue({ affected: 1 }),
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
        {
          provide: IntegrationsService,
          useValue: {
            logEvent: jest.fn(),
            sendOtpViaWhatsApp: jest.fn().mockResolvedValue(undefined),
          },
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
    it('should register a new user with email + password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'Secure123' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.user).toBeDefined();
          expect(res.body.data.token).toBeDefined();
          expect(res.body.data.refreshToken).toBeDefined();
        });
    });

    it('should reject missing email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ password: 'Secure123' })
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
        });
    });

    it('should reject missing password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);
    });

    it('should reject short password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: '12' })
        .expect(400);
    });

    it('should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'dupe@example.com', password: 'Secure123' });

      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'dupe@example.com', password: 'Secure123' })
        .expect(409);
    });

    it('should reject unknown fields', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'Secure123',
          hackerField: 'injection',
        })
        .expect(400);
    });
  });

  // ─── Login ───

  describe('POST /api/auth/login', () => {
    it('should login with valid email + password', async () => {
      // Register first
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'login@example.com', password: 'Secure123' });

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'Secure123' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should 401 for wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'login2@example.com', password: 'Secure123' });

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'login2@example.com', password: 'WrongPassword' })
        .expect(401);
    });

    it('should 401 for unregistered email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'Secure123' })
        .expect(401);
    });
  });

  // ─── Me (protected) ───

  describe('GET /api/auth/me', () => {
    it('should 401 without token', () => {
      return request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('should return profile with valid token', async () => {
      const regRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'me@example.com', password: 'Secure123' });
      const token = regRes.body.data.token;

      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.email).toBe('me@example.com');
        });
    });
  });

  // ─── RolesGuard ───

  describe('RolesGuard integration', () => {
    it('should allow registered user to access /me', async () => {
      const regRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'guard@example.com', password: 'Secure123' });
      const token = regRes.body.data.token;

      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});

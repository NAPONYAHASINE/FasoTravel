import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { StationsModule } from './stations/stations.module';
import { TripsModule } from './trips/trips.module';
import { BookingsModule } from './bookings/bookings.module';
import { TicketsModule } from './tickets/tickets.module';
import { PaymentsModule } from './payments/payments.module';
import { OperatorsModule } from './operators/operators.module';
import { TrackingModule } from './tracking/tracking.module';
import { ReferralsModule } from './referrals/referrals.module';
import { IncidentsModule } from './incidents/incidents.module';
import { StoriesModule } from './stories/stories.module';
import { AdsModule } from './ads/ads.module';
import { PromotionsModule } from './promotions/promotions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { SecurityModule } from './security/security.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SupportModule } from './support/support.module';
import { PoliciesModule } from './policies/policies.module';
import { SocieteModule } from './societe/societe.module';
import { SettingsModule } from './settings/settings.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { AdminExtrasModule } from './admin-extras/admin-extras.module';
import { ExternalApiModule } from './external-api/external-api.module';
import { HeartbeatModule } from './heartbeat/heartbeat.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { join } from 'path';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import googleConfig from './config/google.config';
import aiConfig from './config/ai.config';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig, googleConfig, aiConfig],
      envFilePath: join(__dirname, '..', '.env'),
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        autoLoadEntities: true,
        synchronize: config.get<boolean>('database.synchronize'),
        logging: config.get<boolean>('database.logging'),
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Scheduling (CRON for booking expiry)
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    StationsModule,
    TripsModule,
    BookingsModule,
    TicketsModule,
    PaymentsModule,
    OperatorsModule,
    TrackingModule,
    ReferralsModule,
    IncidentsModule,
    StoriesModule,
    AdsModule,
    PromotionsModule,
    DashboardModule,
    UsersModule,
    AuditModule,
    SecurityModule,
    NotificationsModule,
    SupportModule,
    PoliciesModule,
    SocieteModule,
    SettingsModule,
    IntegrationsModule,
    AdminExtrasModule,
    ExternalApiModule,
    HeartbeatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global JWT auth guard
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Global roles guard
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

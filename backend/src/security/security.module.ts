import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  UserSession,
  SecurityEvent,
  BlockedIp,
} from '../database/entities';
import {
  AdminSecurityController,
  SessionsController,
  AdminSessionsController,
} from './security.controller';
import { SecurityService } from './security.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSession, SecurityEvent, BlockedIp]),
  ],
  controllers: [
    AdminSecurityController,
    SessionsController,
    AdminSessionsController,
  ],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}

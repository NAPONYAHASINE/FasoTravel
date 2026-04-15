import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import {
  User,
  UserSession,
  SecurityEvent,
  BlockedIp,
} from '../database/entities';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { TOTP, Secret } from 'otpauth';
import { BCRYPT_SALT_ROUNDS } from '../common/constants';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionRepo: Repository<UserSession>,
    @InjectRepository(SecurityEvent)
    private readonly eventRepo: Repository<SecurityEvent>,
    @InjectRepository(BlockedIp)
    private readonly blockedIpRepo: Repository<BlockedIp>,
  ) {}

  /* ────────── GET /admin/security/profile ────────── */
  async getSecurityProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const activeSessions = await this.sessionRepo.find({
      where: { userId },
      order: { lastActiveAt: 'DESC' },
      take: 10,
    });

    const recentEvents = await this.eventRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      twoFactorEnabled: user.mfaEnabled,
      lastPasswordChange: user.updatedAt?.toISOString(),
      activeSessions: activeSessions.map((s) => this.toSessionDto(s)),
      recentEvents: recentEvents.map((e) => this.toEventDto(e)),
    };
  }

  /* ────────── POST /admin/security/change-password ────────── */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ip?: string,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      await this.logSecurityEvent(
        userId,
        'failed_login',
        'Failed password change attempt',
        ip,
      );
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.userRepo.save(user);
    await this.logSecurityEvent(
      userId,
      'password_change',
      'Password changed successfully',
      ip,
    );
    this.logger.log(`User ${userId} changed password`);
  }

  /* ────────── POST /admin/security/2fa/enable ────────── */
  async initiate2FA(userId: string, ip?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.mfaEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const secret = new Secret({ size: 20 });
    const totp = new TOTP({
      issuer: 'FasoTravel',
      label: user.email ?? user.name ?? userId,
      secret,
      digits: 6,
      period: 30,
    });

    // Store secret temporarily (will be confirmed on verify)
    user.mfaSecret = secret.base32;
    user.mfaBackupCodes = this.generateBackupCodes();
    await this.userRepo.save(user);

    const qrCodeUrl = await QRCode.toDataURL(totp.toString());

    await this.logSecurityEvent(
      userId,
      '2fa_enabled',
      '2FA setup initiated',
      ip,
    );

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes: user.mfaBackupCodes,
    };
  }

  /* ────────── POST /admin/security/2fa/verify ────────── */
  async verify2FA(userId: string, code: string, ip?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.mfaSecret) {
      throw new BadRequestException('2FA setup not initiated');
    }

    const totp = new TOTP({
      issuer: 'FasoTravel',
      label: user.email ?? user.name ?? userId,
      secret: Secret.fromBase32(user.mfaSecret),
      digits: 6,
      period: 30,
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      throw new BadRequestException('Invalid 2FA code');
    }

    user.mfaEnabled = true;
    await this.userRepo.save(user);
    await this.logSecurityEvent(
      userId,
      '2fa_enabled',
      '2FA enabled successfully',
      ip,
    );
    this.logger.log(`User ${userId} enabled 2FA`);
  }

  /* ────────── POST /admin/security/2fa/disable ────────── */
  async disable2FA(userId: string, ip?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.mfaEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    user.mfaEnabled = false;
    user.mfaSecret = null as unknown as string;
    user.mfaBackupCodes = null as unknown as string[];
    await this.userRepo.save(user);
    await this.logSecurityEvent(userId, '2fa_disabled', '2FA disabled', ip);
    this.logger.log(`User ${userId} disabled 2FA`);
  }

  /* ────────── GET /admin/security/sessions ────────── */
  async getActiveSessions(userId: string) {
    const sessions = await this.sessionRepo.find({
      where: { userId },
      order: { lastActiveAt: 'DESC' },
    });
    return sessions.map((s) => this.toSessionDto(s));
  }

  /* ────────── DELETE /admin/security/sessions/:id/revoke ────────── */
  async revokeSession(userId: string, sessionId: string, ip?: string) {
    const session = await this.sessionRepo.findOne({
      where: { sessionId, userId },
    });
    if (!session) throw new NotFoundException('Session not found');

    await this.sessionRepo.remove(session);
    await this.logSecurityEvent(
      userId,
      'session_revoked',
      `Session ${sessionId} revoked`,
      ip,
    );
  }

  /* ────────── DELETE /admin/security/sessions/revoke-others ────────── */
  async revokeAllOtherSessions(
    userId: string,
    currentSessionId?: string,
    ip?: string,
  ) {
    const qb = this.sessionRepo
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId });

    if (currentSessionId) {
      qb.andWhere('session_id != :sid', { sid: currentSessionId });
    }

    const result = await qb.execute();
    await this.logSecurityEvent(
      userId,
      'session_revoked',
      'All other sessions revoked',
      ip,
    );
    return { count: result.affected ?? 0 };
  }

  /* ────────── GET /admin/security/events ────────── */
  async getSecurityEvents(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.eventRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: data.map((e) => this.toEventDto(e)),
      total,
      page,
      limit,
    };
  }

  /* ═══════════ Session Management (Platform-wide) ══════════ */

  /* ────────── GET /sessions ────────── */
  async getAllSessions(query: {
    page?: number;
    limit?: number;
    deviceType?: string;
    userType?: string;
    active?: boolean;
    search?: string;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.user', 'u')
      .orderBy('s.last_active_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.deviceType) {
      qb.andWhere('s.device_type = :dt', { dt: query.deviceType });
    }
    if (query.userType) {
      qb.andWhere('u.role = :role', { role: query.userType });
    }
    if (query.active !== undefined) {
      if (query.active) {
        qb.andWhere('s.expires_at > NOW()');
      } else {
        qb.andWhere('s.expires_at <= NOW()');
      }
    }
    if (query.search) {
      qb.andWhere('(u.name ILIKE :s OR u.email ILIKE :s)', {
        s: `%${query.search}%`,
      });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((s) => this.toPlatformSessionDto(s)),
      total,
      page,
      limit,
    };
  }

  /* ────────── GET /sessions/:id ────────── */
  async getSessionById(sessionId: string) {
    const session = await this.sessionRepo.findOne({
      where: { sessionId },
      relations: ['user'],
    });
    if (!session) throw new NotFoundException('Session not found');
    return this.toPlatformSessionDto(session);
  }

  /* ────────── GET /sessions/stats ────────── */
  async getSessionStats() {
    const now = new Date();
    const total = await this.sessionRepo.count();
    const active = await this.sessionRepo.count({
      where: { expiresAt: MoreThanOrEqual(now) },
    });
    const inactive = total - active;

    const blockedIps = await this.blockedIpRepo.find({
      select: ['ipAddress'],
    });

    return {
      total,
      active,
      inactive,
      suspicious: 0,
      byDevice: {},
      byUserType: {},
      suspiciousUserIds: [],
      blockedIps: blockedIps.map((b) => b.ipAddress),
    };
  }

  /* ────────── DELETE /sessions/:id/terminate ────────── */
  async terminateSession(sessionId: string) {
    const session = await this.sessionRepo.findOne({
      where: { sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    await this.sessionRepo.remove(session);
  }

  /* ────────── POST /sessions/terminate-bulk ────────── */
  async terminateBulk(sessionIds: string[]) {
    let count = 0;
    for (const sid of sessionIds) {
      const session = await this.sessionRepo.findOne({
        where: { sessionId: sid },
      });
      if (session) {
        await this.sessionRepo.remove(session);
        count++;
      }
    }
    return { count };
  }

  /* ────────── DELETE /sessions/user/:userId/terminate ────────── */
  async terminateByUser(userId: string) {
    const result = await this.sessionRepo
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId })
      .execute();
    return { count: result.affected ?? 0 };
  }

  /* ────────── POST /sessions/terminate-suspicious ────────── */
  terminateAllSuspicious() {
    // For now, no suspicious detection — placeholder
    return { count: 0 };
  }

  /* ────────── POST /sessions/block-ip ────────── */
  async blockIp(ip: string, reason?: string, blockedBy?: string) {
    const existing = await this.blockedIpRepo.findOne({
      where: { ipAddress: ip },
    });
    if (existing) {
      throw new BadRequestException(`IP ${ip} is already blocked`);
    }

    const blocked = this.blockedIpRepo.create({
      ipAddress: ip,
      reason,
      blockedBy,
    });
    await this.blockedIpRepo.save(blocked);

    // Terminate sessions from this IP
    const result = await this.sessionRepo
      .createQueryBuilder()
      .delete()
      .where('ip_address = :ip', { ip })
      .execute();

    return { count: result.affected ?? 0 };
  }

  /* ────────── GET /sessions/blocked-ips ────────── */
  async getBlockedIps() {
    const ips = await this.blockedIpRepo.find({
      select: ['ipAddress'],
      order: { createdAt: 'DESC' },
    });
    return ips.map((b) => b.ipAddress);
  }

  /* ────────── DELETE /sessions/blocked-ips/:ip ────────── */
  async unblockIp(ip: string) {
    const blocked = await this.blockedIpRepo.findOne({
      where: { ipAddress: ip },
    });
    if (!blocked) {
      throw new NotFoundException(`IP ${ip} is not blocked`);
    }
    await this.blockedIpRepo.remove(blocked);
  }

  async exportSessions(filters: {
    page?: number;
    limit?: number;
    deviceType?: string;
    userType?: string;
    active?: boolean;
    search?: string;
  }) {
    // Return all sessions without pagination for CSV export
    const result = await this.getAllSessions({
      ...filters,
      page: 1,
      limit: 10000,
    });
    return {
      data: result.data,
      exportedAt: new Date().toISOString(),
      total: result.total ?? result.data.length,
    };
  }

  /* ────────── helpers ────────── */

  async logSecurityEvent(
    userId: string,
    type: string,
    description: string,
    ip?: string,
  ) {
    const event = this.eventRepo.create({
      userId,
      type,
      description,
      ipAddress: ip,
    });
    await this.eventRepo.save(event);
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );
  }

  private toSessionDto(s: UserSession) {
    return {
      id: s.sessionId,
      deviceInfo: s.userAgent ?? s.deviceType,
      ipAddress: s.ipAddress,
      location: '',
      loginAt: s.createdAt?.toISOString(),
      lastActivityAt: s.lastActiveAt?.toISOString(),
      isCurrent: false,
    };
  }

  private toEventDto(e: SecurityEvent) {
    return {
      id: e.id,
      type: e.type,
      description: e.description,
      ipAddress: e.ipAddress,
      location: e.location ?? '',
      createdAt: e.createdAt?.toISOString(),
    };
  }

  private toPlatformSessionDto(s: UserSession) {
    const user = s.user as Record<string, unknown> | undefined;
    return {
      id: s.sessionId,
      userId: s.userId,
      userName: user?.['name'] as string | undefined,
      userType: user?.['role'] as string | undefined,
      deviceType: s.deviceType,
      deviceInfo: s.userAgent,
      ipAddress: s.ipAddress,
      loginAt: s.createdAt?.toISOString(),
      lastActivityAt: s.lastActiveAt?.toISOString(),
      active: s.expiresAt ? s.expiresAt > new Date() : false,
    };
  }
}

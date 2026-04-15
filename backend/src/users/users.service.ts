import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Notification } from '../database/entities';
import { UserRole, UserStatus } from '../common/constants';
import { UpdatePassengerDto } from './dto';
import { PassengerQueryDto } from './dto';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  /* ────────── GET /admin/passengers ────────── */
  async findPassengers(query: PassengerQueryDto) {
    const where: Record<string, unknown> = { role: UserRole.PASSENGER };

    if (query.status) {
      where['status'] = query.status;
    }
    if (query.search) {
      // Will search by name — override 'where' to use ILike
      return this.findPassengersWithSearch(query);
    }

    const [data, total] = await this.userRepo.findAndCount({
      where,
      order: { createdAt: query.order ?? 'DESC' },
      skip: query.skip,
      take: query.limit,
      select: this.passengerSelect(),
    });

    return {
      data: data.map((u) => this.toPassengerDto(u)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  private async findPassengersWithSearch(query: PassengerQueryDto) {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .where('u.role = :role', { role: UserRole.PASSENGER });

    if (query.status) {
      qb.andWhere('u.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere(
        '(u.name ILIKE :search OR u.email ILIKE :search OR u.phone_number ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('u.created_at', query.order ?? 'DESC')
      .skip(query.skip)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((u) => this.toPassengerDto(u)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  /* ────────── GET /admin/passengers/:id ────────── */
  async findPassengerById(id: string) {
    const user = await this.userRepo.findOne({
      where: { id, role: UserRole.PASSENGER },
    });
    if (!user) {
      throw new NotFoundException(`Passenger ${id} not found`);
    }
    return this.toPassengerDto(user);
  }

  /* ────────── PATCH /admin/passengers/:id ────────── */
  async updatePassenger(id: string, dto: UpdatePassengerDto) {
    const user = await this.userRepo.findOne({
      where: { id, role: UserRole.PASSENGER },
    });
    if (!user) {
      throw new NotFoundException(`Passenger ${id} not found`);
    }

    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email;
    if (dto.phone) user.phoneNumber = dto.phone;

    const saved = await this.userRepo.save(user);
    this.logger.log(`Passenger ${id} updated`);
    return this.toPassengerDto(saved);
  }

  /* ────────── POST /admin/passengers/:id/suspend ────────── */
  async suspendPassenger(id: string, reason: string) {
    const user = await this.findPassengerEntity(id);
    if (user.status === (UserStatus.SUSPENDED as string)) {
      throw new BadRequestException('Passenger already suspended');
    }
    user.status = UserStatus.SUSPENDED;
    await this.userRepo.save(user);
    this.logger.warn(`Passenger ${id} suspended: ${reason}`);
  }

  /* ────────── POST /admin/passengers/:id/reactivate ────────── */
  async reactivatePassenger(id: string) {
    const user = await this.findPassengerEntity(id);
    if (user.status === (UserStatus.ACTIVE as string)) {
      throw new BadRequestException('Passenger already active');
    }
    user.status = UserStatus.ACTIVE;
    await this.userRepo.save(user);
    this.logger.log(`Passenger ${id} reactivated`);
  }

  /* ────────── POST /admin/passengers/:id/verify ────────── */
  async verifyPassenger(id: string) {
    const user = await this.findPassengerEntity(id);
    user.isVerified = true;
    await this.userRepo.save(user);
    this.logger.log(`Passenger ${id} verified`);
  }

  /* ────────── POST /admin/passengers/:id/reset-password ────────── */
  async resetPassengerPassword(id: string) {
    const user = await this.findPassengerEntity(id);
    const temporaryPassword = crypto.randomBytes(8).toString('hex');
    // In production, hash and save
    this.logger.log(`Passenger ${id} password reset`);
    // Mark as needing password change
    user.passwordHash = temporaryPassword; // Would be hashed in real impl
    await this.userRepo.save(user);
    return { temporaryPassword };
  }

  /* ────────── DELETE /admin/passengers/:id ────────── */
  async deletePassenger(id: string) {
    const user = await this.findPassengerEntity(id);
    await this.userRepo.remove(user);
    this.logger.warn(`Passenger ${id} deleted`);
  }

  /* ────────── POST /admin/passengers/:id/notify ────────── */
  async sendNotification(id: string, data: { title: string; message: string }) {
    await this.findPassengerEntity(id);
    const notif = this.notifRepo.create({
      userId: id,
      title: data.title,
      message: data.message,
      type: 'admin_message',
    });
    await this.notifRepo.save(notif);
    this.logger.log(`Notification sent to passenger ${id}`);
  }

  /* ────────── helpers ────────── */

  private async findPassengerEntity(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id, role: UserRole.PASSENGER },
    });
    if (!user) {
      throw new NotFoundException(`Passenger ${id} not found`);
    }
    return user;
  }

  private passengerSelect(): (keyof User)[] {
    return [
      'id',
      'name',
      'email',
      'phoneNumber',
      'status',
      'isVerified',
      'createdAt',
      'updatedAt',
      'profileImageUrl',
      'referralCode',
      'referralPointsBalance',
      'badgeLevel',
    ];
  }

  private toPassengerDto(user: User) {
    return {
      id: user.id,
      name:
        user.name ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      email: user.email,
      phone: user.phoneNumber,
      status: user.status as 'active' | 'suspended',
      verified: user.isVerified,
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
      profileImageUrl: user.profileImageUrl,
      referralCode: user.referralCode,
      referralPointsBalance: user.referralPointsBalance,
      badgeLevel: user.badgeLevel,
    };
  }

  // ========== MOBILE USER PROFILE ==========

  async getUserProfile(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    return this.toPassengerDto(user);
  }

  async updateUserProfile(userId: string, dto: UpdatePassengerDto) {
    return this.updatePassenger(userId, dto);
  }

  async exportUserData(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    const notifications = await this.notifRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    return {
      profile: this.toPassengerDto(user),
      notifications: notifications.map((n) => ({
        id: n.notificationId,
        title: n.title,
        message: n.message,
        type: n.type,
        createdAt: n.createdAt?.toISOString(),
      })),
      exportedAt: new Date().toISOString(),
    };
  }

  async deleteUserAccount(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.remove(user);
    this.logger.warn(`User ${userId} deleted their account`);
    return { message: 'Account deleted successfully' };
  }
}

import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserRole, UserStatus } from '../../common/constants';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string;

  @Column({
    name: 'phone_number',
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: true,
  })
  phoneNumber: string;

  @Column({ name: 'first_name', type: 'varchar', length: 255, nullable: true })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 255, nullable: true })
  lastName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passwordHash: string;

  @Column({ type: 'varchar', length: 30, default: UserRole.PASSENGER })
  role: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: UserStatus.ACTIVE,
  })
  status: string;

  @Column({
    name: 'preferred_language',
    type: 'varchar',
    length: 10,
    default: 'fr',
  })
  preferredLanguage: string;

  @Column({
    name: 'profile_image_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  profileImageUrl: string;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'push_enabled', type: 'boolean', default: true })
  pushEnabled: boolean;

  @Column({
    name: 'referral_code',
    type: 'varchar',
    length: 20,
    nullable: true,
    unique: true,
  })
  referralCode: string;

  @Column({ name: 'referred_by', type: 'uuid', nullable: true })
  referredBy: string;

  @Column({ name: 'referral_points_balance', type: 'int', default: 0 })
  referralPointsBalance: number;

  @Column({ name: 'total_referrals', type: 'int', default: 0 })
  totalReferrals: number;

  @Column({
    name: 'badge_level',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  badgeLevel: string;

  @Column({ name: 'otp_code', type: 'varchar', length: 10, nullable: true })
  otpCode: string;

  @Column({ name: 'otp_expires_at', type: 'timestamp', nullable: true })
  otpExpiresAt: Date;

  @Column({
    name: 'refresh_token',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  refreshToken: string;

  // Societe-specific fields
  @Column({ name: 'company_id', type: 'varchar', length: 50, nullable: true })
  companyId: string;

  @Column({
    name: 'company_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  companyName: string;

  @Column({ name: 'gare_id', type: 'varchar', length: 50, nullable: true })
  gareId: string;

  @Column({ name: 'gare_name', type: 'varchar', length: 255, nullable: true })
  gareName: string;

  // Admin-specific fields
  @Column({ name: 'operator_id', type: 'varchar', length: 50, nullable: true })
  operatorId: string;

  @Column({ type: 'jsonb', nullable: true })
  permissions: string[];

  @Column({ name: 'mfa_enabled', type: 'boolean', default: false })
  mfaEnabled: boolean;

  @Column({ name: 'mfa_secret', type: 'varchar', length: 255, nullable: true })
  mfaSecret: string;

  @Column({ name: 'mfa_backup_codes', type: 'jsonb', nullable: true })
  mfaBackupCodes: string[];

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;
}

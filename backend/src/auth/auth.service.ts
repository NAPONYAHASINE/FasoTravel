import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities';
import { UserRole, UserStatus } from '../common/constants';
import { IntegrationsService } from '../integrations/integrations.service';
import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ResendOtpDto,
} from './dto/auth.dto';
import {
  BCRYPT_SALT_ROUNDS,
  OTP_EXPIRATION_MINUTES,
  REFERRAL_CODE_PREFIX,
  TICKET_CODE_LENGTH,
  POINTS_PER_REFERRAL,
} from '../common/constants';
import { generateAlphanumericCode } from '../common/utils/code-generator';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private static readonly ADMIN_ROLES: string[] = [
    UserRole.SUPER_ADMIN,
    UserRole.OPERATOR_ADMIN,
    UserRole.SUPPORT_ADMIN,
    UserRole.FINANCE_ADMIN,
  ];

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  /**
   * Register — email + password (all frontends).
   * Mobile sends: { email, password, phone, firstName, lastName, referralCode? }
   * Societe sends: { email, password, name, role, companyId?, gareId?, gareName? }
   */
  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    // Determine display name
    const name =
      dto.name ||
      [dto.firstName, dto.lastName].filter(Boolean).join(' ') ||
      dto.email;

    // Normalize role: Societe sends 'cashier' but backend uses 'caissier'
    let role = dto.role || UserRole.PASSENGER;
    if (role === 'cashier') role = UserRole.CAISSIER;

    // Resolve referral code → referrer user ID
    let referredByUserId: string | undefined;
    if (dto.referralCode) {
      const referrer = await this.userRepository.findOne({
        where: { referralCode: dto.referralCode },
      });
      if (referrer) {
        referredByUserId = referrer.id;
      }
    }

    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      phoneNumber: dto.phone,
      firstName: dto.firstName,
      lastName: dto.lastName,
      name,
      role,
      status: UserStatus.ACTIVE,
      isVerified: false,
      referralCode: this.generateReferralCode(),
      referredBy: referredByUserId,
      companyId: dto.companyId,
      gareId: dto.gareId,
      gareName: dto.gareName,
    });

    const savedUser = await this.userRepository.save(user);

    // Credit referrer if applicable
    if (referredByUserId) {
      await this.userRepository.increment(
        { id: referredByUserId },
        'totalReferrals',
        1,
      );
      await this.userRepository.increment(
        { id: referredByUserId },
        'referralPointsBalance',
        POINTS_PER_REFERRAL,
      );
    }

    // Return tokens directly (frontends expect immediate auth)
    const tokens = await this.generateTokens(savedUser);

    savedUser.refreshToken = await bcrypt.hash(
      tokens.refreshToken,
      BCRYPT_SALT_ROUNDS,
    );
    await this.userRepository.save(savedUser);

    return {
      user: this.sanitizeUser(savedUser),
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      expiresIn: 3600,
    };
  }

  /**
   * Login — email + password (all 3 frontends send { email, password }).
   *
   * Admin roles → tokens returned immediately.
   * Non-admin (PASSENGER, RESPONSABLE, MANAGER, CAISSIER) → OTP generated,
   *   sent via WhatsApp, caller must verify via /auth/verify-otp.
   */
  async login(dto: LoginDto) {
    // Si le login est un numéro WhatsApp (pattern @phone.transportbf.bf),
    // chercher par phoneNumber en plus de l'email
    let user: User | null = null;
    const isPhoneLogin = dto.email.endsWith('@phone.transportbf.bf');

    if (isPhoneLogin) {
      const phoneNumber = dto.email.replace('@phone.transportbf.bf', '');
      user = await this.userRepository.findOne({
        where: [{ email: dto.email }, { phoneNumber }],
      });
    } else {
      user = await this.userRepository.findOne({
        where: { email: dto.email },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === (UserStatus.SUSPENDED as string)) {
      throw new UnauthorizedException('Account is suspended');
    }

    if (user.status === (UserStatus.INACTIVE as string)) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    user.lastLoginAt = new Date();

    // ── Admin: tokens immédiats ──
    if (this.isAdminRole(user.role)) {
      const tokens = await this.generateTokens(user);

      user.refreshToken = await bcrypt.hash(
        tokens.refreshToken,
        BCRYPT_SALT_ROUNDS,
      );
      await this.userRepository.save(user);

      return {
        user: this.sanitizeUser(user),
        token: tokens.token,
        refreshToken: tokens.refreshToken,
        expiresIn: 3600,
      };
    }

    // ── Non-admin: OTP via WhatsApp ──
    const { otpCode, otpExpiresAt } = this.generateOtpWithExpiry();
    user.otpCode = otpCode;
    user.otpExpiresAt = otpExpiresAt;
    await this.userRepository.save(user);

    // Extraire le numéro WhatsApp (phoneNumber ou partie avant @phone.transportbf.bf)
    const whatsappNumber =
      user.phoneNumber ||
      (dto.email.endsWith('@phone.transportbf.bf')
        ? dto.email.replace('@phone.transportbf.bf', '')
        : null);

    if (whatsappNumber) {
      await this.integrationsService.sendOtpViaWhatsApp(
        whatsappNumber,
        otpCode,
      );
    } else {
      this.logger.warn(
        `Aucun numéro WhatsApp pour l'utilisateur ${user.id} — OTP non envoyé`,
      );
    }

    return {
      otpRequired: true,
      identifier: dto.email,
      message: 'OTP envoyé sur votre WhatsApp',
      ...(this.configService.get('NODE_ENV') !== 'production' && { otpCode }),
    };
  }

  /**
   * Verify OTP (for 2FA / email verification).
   * Mobile sends: { identifier, code, mode }
   * Admin sends:  { code, email }
   */
  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email || dto.identifier;

    if (!email) {
      throw new BadRequestException('Email or identifier is required');
    }

    // Si l'identifiant est un numéro WhatsApp (pattern @phone.transportbf.bf),
    // chercher par phoneNumber en plus de l'email
    let user: User | null = null;
    const isPhoneLogin = email.endsWith('@phone.transportbf.bf');

    if (isPhoneLogin) {
      const phoneNumber = email.replace('@phone.transportbf.bf', '');
      user = await this.userRepository.findOne({
        where: [{ email }, { phoneNumber }],
      });
    } else {
      user = await this.userRepository.findOne({
        where: { email },
      });
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new BadRequestException('No OTP requested');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestException('OTP expired');
    }

    if (user.otpCode !== dto.code) {
      throw new UnauthorizedException('Invalid OTP');
    }

    user.otpCode = null as unknown as string;
    user.otpExpiresAt = null as unknown as Date;
    user.isVerified = true;
    await this.userRepository.save(user);

    const tokens = await this.generateTokens(user);

    user.refreshToken = await bcrypt.hash(
      tokens.refreshToken,
      BCRYPT_SALT_ROUNDS,
    );
    await this.userRepository.save(user);

    return {
      user: this.sanitizeUser(user),
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      expiresIn: 3600,
    };
  }

  /**
   * Resend OTP — called by Mobile + Admin.
   * Non-admin → OTP renvoyé via WhatsApp.
   * Admin → OTP renvoyé via email (stub en dev).
   */
  async resendOtp(dto: ResendOtpDto) {
    // Si le login est un numéro WhatsApp, chercher aussi par phoneNumber
    let user: User | null = null;
    const isPhoneLogin = dto.email.endsWith('@phone.transportbf.bf');

    if (isPhoneLogin) {
      const phoneNumber = dto.email.replace('@phone.transportbf.bf', '');
      user = await this.userRepository.findOne({
        where: [{ email: dto.email }, { phoneNumber }],
      });
    } else {
      user = await this.userRepository.findOne({
        where: { email: dto.email },
      });
    }

    if (!user) {
      return { message: 'If this email is registered, an OTP has been sent' };
    }

    const { otpCode, otpExpiresAt } = this.generateOtpWithExpiry();

    user.otpCode = otpCode;
    user.otpExpiresAt = otpExpiresAt;
    await this.userRepository.save(user);

    // Non-admin: envoyer via WhatsApp
    if (!this.isAdminRole(user.role)) {
      const whatsappNumber =
        user.phoneNumber ||
        (dto.email.endsWith('@phone.transportbf.bf')
          ? dto.email.replace('@phone.transportbf.bf', '')
          : null);

      if (whatsappNumber) {
        await this.integrationsService.sendOtpViaWhatsApp(
          whatsappNumber,
          otpCode,
        );
      }
    }
    // Admin: email (stub — en dev, OTP retourné dans la réponse)

    return {
      message: this.isAdminRole(user.role)
        ? 'OTP envoyé par email'
        : 'OTP envoyé sur votre WhatsApp',
      ...(this.configService.get('NODE_ENV') !== 'production' && { otpCode }),
    };
  }

  /**
   * Refresh token.
   * Mobile sends empty body (token from Authorization header or localStorage).
   * Societe sends { refreshToken } in body.
   * Admin uses /auth/refresh with { refreshToken }.
   */
  async refreshToken(dto: RefreshTokenDto, headerToken?: string) {
    const tokenToVerify = dto.refreshToken || headerToken;

    if (!tokenToVerify) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const payload: { sub: string; role: string } = this.jwtService.verify(
      tokenToVerify,
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      },
    );

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isMatch = await bcrypt.compare(tokenToVerify, user.refreshToken);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);

    user.refreshToken = await bcrypt.hash(
      tokens.refreshToken,
      BCRYPT_SALT_ROUNDS,
    );
    await this.userRepository.save(user);

    return {
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      expiresIn: 3600,
    };
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async logout(userId: string) {
    await this.userRepository.update(
      { id: userId },
      { refreshToken: null as unknown as string },
    );
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      return {
        message: 'If this email is registered, an OTP has been sent',
      };
    }

    const { otpCode, otpExpiresAt } = this.generateOtpWithExpiry();

    user.otpCode = otpCode;
    user.otpExpiresAt = otpExpiresAt;
    await this.userRepository.save(user);

    return {
      message: 'If this email is registered, an OTP has been sent',
      ...(this.configService.get('NODE_ENV') !== 'production' && { otpCode }),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new BadRequestException(
        'No OTP requested. Call forgot-password first.',
      );
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestException('OTP expired');
    }

    if (user.otpCode !== dto.code) {
      throw new UnauthorizedException('Invalid OTP');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);
    user.otpCode = null as unknown as string;
    user.otpExpiresAt = null as unknown as Date;
    await this.userRepository.save(user);

    return { message: 'Password has been reset successfully' };
  }

  // ─── Private helpers ───

  private async generateTokens(user: User) {
    const payload = { sub: user.id, role: user.role };

    const [token, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('jwt.secret'),
        expiresIn: this.configService.get<string>(
          'jwt.expiresIn',
          '1h',
        ) as unknown as import('ms').StringValue,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>(
          'jwt.refreshExpiresIn',
          '30d',
        ) as unknown as import('ms').StringValue,
      }),
    ]);

    return { token, refreshToken };
  }

  sanitizeUser(user: User): Record<string, unknown> {
    const {
      passwordHash: _ph,
      otpCode: _otp,
      otpExpiresAt: _otpExp,
      refreshToken: _rt,
      ...rest
    } = user;
    return rest;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateOtpWithExpiry() {
    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(
      Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000,
    );
    return { otpCode, otpExpiresAt };
  }

  private isAdminRole(role: string): boolean {
    return AuthService.ADMIN_ROLES.includes(role);
  }

  private generateReferralCode(): string {
    return generateAlphanumericCode(TICKET_CODE_LENGTH, REFERRAL_CODE_PREFIX);
  }
}

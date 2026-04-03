import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities';
import { UserRole } from '../common/constants';
import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import {
  BCRYPT_SALT_ROUNDS,
  REFERRAL_CODE_PREFIX,
  TICKET_CODE_LENGTH,
} from '../common/constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (existing) {
      throw new ConflictException('Phone number already registered');
    }

    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = this.userRepository.create({
      phoneNumber: dto.phoneNumber,
      fullName: dto.fullName,
      email: dto.email,
      role: UserRole.PASSENGER,
      otpCode,
      otpExpiresAt,
      referralCode: this.generateReferralCode(),
      referredBy: dto.referralCode || undefined,
    });

    await this.userRepository.save(user);

    // TODO: Send OTP via SMS (Infobip integration)
    // In dev mode, return OTP directly
    return {
      message: 'OTP sent to your phone number',
      ...(this.configService.get('NODE_ENV') !== 'production' && { otpCode }),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!user) {
      throw new UnauthorizedException('Phone number not registered');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.otpCode = otpCode;
    user.otpExpiresAt = otpExpiresAt;
    await this.userRepository.save(user);

    // TODO: Send OTP via SMS
    return {
      message: 'OTP sent to your phone number',
      ...(this.configService.get('NODE_ENV') !== 'production' && { otpCode }),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.userRepository.findOne({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!user) {
      throw new UnauthorizedException('Phone number not registered');
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new BadRequestException('No OTP requested');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestException('OTP expired');
    }

    if (user.otpCode !== dto.otpCode) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Clear OTP & verify user
    user.otpCode = null as unknown as string;
    user.otpExpiresAt = null as unknown as Date;
    user.isVerified = true;
    await this.userRepository.save(user);

    const tokens = await this.generateTokens(user);

    // Store refresh token hash
    user.refreshToken = await bcrypt.hash(
      tokens.refreshToken,
      BCRYPT_SALT_ROUNDS,
    );
    await this.userRepository.save(user);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const payload: { sub: string; role: string } = this.jwtService.verify(
      dto.refreshToken,
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      },
    );

    const user = await this.userRepository.findOne({
      where: { userId: payload.sub },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isMatch = await bcrypt.compare(dto.refreshToken, user.refreshToken);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);

    user.refreshToken = await bcrypt.hash(
      tokens.refreshToken,
      BCRYPT_SALT_ROUNDS,
    );
    await this.userRepository.save(user);

    return tokens;
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async logout(userId: string) {
    await this.userRepository.update(
      { userId },
      { refreshToken: null as unknown as string },
    );
    return { message: 'Logged out successfully' };
  }

  // ─── Private helpers ───

  private async generateTokens(user: User) {
    const payload = { sub: user.userId, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret', 'fallback-secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn', '1h') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>(
          'jwt.refreshSecret',
          'fallback-refresh',
        ),
        expiresIn: this.configService.get<string>(
          'jwt.refreshExpiresIn',
          '30d',
        ) as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(
    user: User,
  ): Omit<User, 'passwordHash' | 'otpCode' | 'otpExpiresAt' | 'refreshToken'> {
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

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = REFERRAL_CODE_PREFIX;
    for (let i = 0; i < TICKET_CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

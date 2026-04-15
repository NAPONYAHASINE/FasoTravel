import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret', 'fallback-secret'),
    });
  }

  async validate(payload: { sub: string; role: string }) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || user.status === 'inactive' || user.status === 'suspended') {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      sub: user.id,
      role: user.role,
      email: user.email,
    };
  }
}

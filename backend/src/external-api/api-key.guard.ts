import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ApiKey } from '../database/entities';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string>;
      operatorId?: string;
      apiKeyScopes?: string[];
      apiKeyId?: string;
    }>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const key = await this.apiKeyRepo.findOne({
      where: { keyHash, isActive: true },
    });

    if (!key) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (key.expiresAt && new Date() > key.expiresAt) {
      throw new UnauthorizedException('API key has expired');
    }

    // Update last used
    key.lastUsedAt = new Date();
    await this.apiKeyRepo.save(key);

    // Attach operator context to request
    request.operatorId = key.operatorId;
    request.apiKeyScopes = key.scopes ?? [];
    request.apiKeyId = key.id;

    return true;
  }

  private extractApiKey(request: {
    headers: Record<string, string>;
  }): string | undefined {
    const header = request.headers['x-api-key'];
    if (header) return header;

    const auth = request.headers['authorization'];
    if (auth?.startsWith('Bearer ')) return auth.slice(7);

    return undefined;
  }
}

import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'dev-secret-change-me',
  refreshSecret:
    process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '1h',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
}));

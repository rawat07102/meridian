import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  type: 'postgres' as const,
  synchronize: false,
  ssl: { rejectUnauthorized: false },
  logging: process.env.NODE_ENV === 'development',
}));

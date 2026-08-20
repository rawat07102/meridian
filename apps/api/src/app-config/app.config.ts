import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '') || 4000,
  NODE_ENV: process.env.NODE_ENV,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}));

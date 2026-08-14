import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '') || 8080,
  NODE_ENV: process.env.NODE_ENV,
}));

import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validate } from './env.validation';
import { appConfig } from './app.config';
import { databaseConfig } from '../database/database.config';
import { authConfig } from '../auth/config/auth.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: '.env.local',
      isGlobal: true,
      validate,
      load: [appConfig, databaseConfig, authConfig],
    }),
  ],
})
export class AppConfigModule {}

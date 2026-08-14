import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validate } from './env.validation';
import { appConfig } from './app.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: '.env.local',
      isGlobal: true,
      validate,
      load: [appConfig],
    }),
  ],
})
export class AppConfigModule {}

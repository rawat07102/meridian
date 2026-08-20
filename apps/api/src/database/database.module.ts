import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './database.config';
import { ConfigType } from '@nestjs/config';
import * as pg from 'pg';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (dbConfig: ConfigType<typeof databaseConfig>) => ({
        type: dbConfig.type,
        driver: pg,
        url: dbConfig.url,
        synchronize: dbConfig.synchronize,
        ssl: dbConfig.ssl,
        logging: dbConfig.logging,
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}

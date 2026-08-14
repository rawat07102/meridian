import { DataSource } from 'typeorm';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config({
  path: path.join(path.resolve(process.cwd(), '.env.local')),
});

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  ssl: { rejectUnauthorized: false },
});

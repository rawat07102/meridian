import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtModule } from '@nestjs/jwt';
import { authConfig } from './config/auth.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RefreshToken]),
    JwtModule.registerAsync({
      inject: [authConfig.KEY],
      useFactory: (config) => ({
        secret: config.jwtSecret,
        signOptions: {
          expiresIn: config.jwtAccessExpiresIn,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}

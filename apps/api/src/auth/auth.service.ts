import { ConflictException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async signup(dto: SignupDto) {
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingUsername = await this.usersService.findByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictException('Username already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      fullName: dto.fullName,
      passwordHash,
    });

    return this.issueToken(user.id);
  }

  private async issueToken(userId: User['id']) {
    const accessToken = await this.jwtService.signAsync({ sub: userId });

    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const hashedRefreshToken = this.hashToken(rawRefreshToken);

    await this.refreshTokenRepository.save({
      userId,
      token: hashedRefreshToken,
      expiresAt: this.getRefreshExpiryDate(),
    });
    return { accessToken, refreshToken: rawRefreshToken };
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private getRefreshExpiryDate(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    return expiresAt;
  }
}

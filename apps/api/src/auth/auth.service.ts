import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { GuestJwtPayload } from './interfaces/guest-jwt-payload.interface';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async signup(dto: SignupDto) {
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingUsername = await this.usersService.findByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      fullName: dto.fullName,
      passwordHash,
    });

    return this.issueTokens(user.id);
  }

  public async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user.id);
  }

  public async refresh(dto: RefreshDto) {
    const hashedRefreshToken = this.hashToken(dto.refreshToken);

    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: hashedRefreshToken },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.refreshTokenRepository.remove(storedToken);

    return this.issueTokens(storedToken.userId);
  }

  public async logout(dto: LogoutDto) {
    const hashedRefreshToken = this.hashToken(dto.refreshToken);
    await this.refreshTokenRepository.delete({ token: hashedRefreshToken });
  }

  async issueGuestToken(workspaceId: string): Promise<{ accessToken: string }> {
    const payload: GuestJwtPayload = { role: 'guest', workspaceId };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    return { accessToken };
  }

  private async issueTokens(userId: User['id']) {
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

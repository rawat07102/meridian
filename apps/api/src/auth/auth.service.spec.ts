import { after, describe } from 'node:test';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { ObjectLiteral, Repository } from 'typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

type MockService<T> = Partial<Record<keyof T, jest.Mock>>;
type MockRepository<T extends ObjectLiteral> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: MockService<UsersService>;
  let refreshTokenRepository: MockRepository<RefreshToken>;
  let jwtService: MockService<JwtService>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    refreshTokenRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockReturnValue('mocke-access-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: getRepositoryToken(RefreshToken), useValue: refreshTokenRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  after(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupDto = {
      email: 'test@example.com',
      username: 'testuser',
      fullName: 'Test User',
      password: 'password123',
    };

    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmail!.mockResolvedValue({ id: 'existing-id' });

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
      await expect(service.signup(signupDto)).rejects.toThrow('Email already in use');
    });

    it('should throw ConflictException if username already exists', async () => {
      usersService.findByEmail!.mockResolvedValue(null);
      usersService.findByUsername!.mockResolvedValue({ id: 'existing-id' });

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
      await expect(service.signup(signupDto)).rejects.toThrow('Username already taken');
    });

    // TODO
    it('should create a user and issue tokesn on success', async () => {
      usersService.findByEmail!.mockResolvedValue(null);
      usersService.findByUsername!.mockResolvedValue(null);
      usersService.create!.mockResolvedValue({ id: 'new-user-id' });
      refreshTokenRepository.save?.mockResolvedValue({});

      const result = await service.signup(signupDto);

      expect(usersService.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };

    it('should throw UnauthorizedException with a generic message when email does not exist', async () => {
      usersService.findByEmail!.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException with the same generic message when password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 12);

      usersService.findByEmail!.mockResolvedValue({ id: 'user-id', passwordHash: hashedPassword });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException for an OAuth-only user (null passwordHash)', async () => {
      usersService.findByEmail!.mockResolvedValue({
        id: 'user-id',
        passwordHash: null,
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('shoulld issue tokens on succesfull login', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 12);
      usersService.findByEmail!.mockResolvedValue({ id: 'user-id', passwordHash: hashedPassword });
      refreshTokenRepository.save?.mockResolvedValue({});

      const result = await service.login(loginDto);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException if token is not found', async () => {
      refreshTokenRepository.findOne?.mockResolvedValue(null);

      await expect(service.refresh({ refreshToken: 'some-token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      refreshTokenRepository.findOne?.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.refresh({ refreshToken: 'some-token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should delete the old token and issue new tokens on success', async () => {
      refreshTokenRepository.findOne?.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });

      refreshTokenRepository.remove?.mockResolvedValue({});
      refreshTokenRepository.save?.mockResolvedValue({});

      const result = await service.refresh({ refreshToken: 'some-token' });
      expect(refreshTokenRepository.remove).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should not allow a old token to be reused', async () => {
      refreshTokenRepository.findOne?.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });

      refreshTokenRepository.remove?.mockResolvedValue({});
      refreshTokenRepository.save?.mockResolvedValue({});

      await service.refresh({ refreshToken: 'original-token' });

      refreshTokenRepository.findOne?.mockResolvedValueOnce(null);

      await expect(service.refresh({ refreshToken: 'original-token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwt = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should throw ConflictException if email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ email: 'test@test.com' });
      await expect(service.signup({ email: 'test@test.com' })).rejects.toThrow(ConflictException);
    });

    it('should create a user with hashed password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockPrisma.user.create.mockResolvedValue({ id: '1', email: 'test@test.com' });

      const result = await service.signup({ email: 'test@test.com', password: 'password', tenantId: 't1' });
      expect(result).toEqual({ id: '1', email: 'test@test.com' });
      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login('wrong@test.com', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password mismatch', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ email: 'test@test.com', password: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login('test@test.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });

    it('should return access token on success', async () => {
      const user = { id: '1', email: 'test@test.com', password: 'hashed', tenantId: 't1', role: 'admin' };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwt.signAsync.mockResolvedValue('token');

      const result = await service.login('test@test.com', 'pass');
      expect(result).toEqual({
        access_token: 'token',
        user: { id: '1', email: 'test@test.com', role: 'admin', tenantId: 't1' },
      });
    });
  });
});

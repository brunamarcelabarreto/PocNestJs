import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

const mockPrisma: any = {
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  tenant: {
    create: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};
mockPrisma.$transaction = jest.fn((cb: (tx: any) => any) => cb(mockPrisma));

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verifyAsync: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('registerTenant', () => {
    it('should create tenant and admin user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue({ id: 'tenant-1', name: 'Acme', slug: 'acme' });
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'admin@acme.com',
        name: 'Admin',
        role: 'ADMIN',
        tenantId: 'tenant-1',
      });

      const result = await service.registerTenant('Acme', 'admin@acme.com', 'senha123', 'Admin');

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({ where: { email: 'admin@acme.com' } });
      expect(result.user.email).toBe('admin@acme.com');
      expect(result.user.role).toBe('ADMIN');
      expect(result.tenant.name).toBe('Acme');
    });

    it('should throw BadRequestException if email already registered', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.registerTenant('Acme', 'admin@acme.com', 'senha123', 'Admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if password is too short', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.registerTenant('Acme', 'admin@acme.com', '123', 'Admin'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    const hashedPassword = bcrypt.hashSync('senha123', 10);

    const mockUser = {
      id: 'user-1',
      email: 'admin@acme.com',
      name: 'Admin',
      role: 'ADMIN',
      tenantId: 'tenant-1',
      password: hashedPassword,
      active: true,
      tenant: { id: 'tenant-1', name: 'Acme' },
    };

    it('should return tokens on valid credentials', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login('admin@acme.com', 'senha123');

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user.email).toBe('admin@acme.com');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.login('nao@existe.com', 'senha123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(service.login('admin@acme.com', 'errada')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, active: false });

      await expect(service.login('admin@acme.com', 'senha123')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

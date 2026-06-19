import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PrismaService } from '../../common/prisma/prisma.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma: any = {
  tenant: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
};
mockPrisma.$transaction = jest.fn((cb: (tx: any) => any) => cb(mockPrisma));

const mockTenant = {
  id: 'tenant-1',
  name: 'Empresa Teste',
  slug: 'empresa-teste',
  createdAt: new Date('2026-06-19'),
  updatedAt: new Date('2026-06-19'),
};

const mockTenantWithRelations = {
  ...mockTenant,
  users: [
    {
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin',
      role: 'ADMIN',
      active: true,
    },
    {
      id: 'user-2',
      email: 'user@example.com',
      name: 'User',
      role: 'USER',
      active: true,
    },
  ],
  contractTemplates: [
    {
      id: 'template-1',
      name: 'Template Padrão',
    },
  ],
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a new tenant', async () => {
      mockPrisma.tenant.create.mockResolvedValue(mockTenant);

      const result = await service.create('Empresa Teste', 'empresa-teste');

      expect(result.id).toBe('tenant-1');
      expect(result.name).toBe('Empresa Teste');
      expect(result.slug).toBe('empresa-teste');
      expect(mockPrisma.tenant.create).toHaveBeenCalledWith({
        data: {
          name: 'Empresa Teste',
          slug: 'empresa-teste',
        },
      });
    });

    it('should create tenant with different names and slugs', async () => {
      const newTenant = {
        id: 'tenant-2',
        name: 'Outra Empresa',
        slug: 'outra-empresa',
      };
      mockPrisma.tenant.create.mockResolvedValue(newTenant);

      const result = await service.create('Outra Empresa', 'outra-empresa');

      expect(result.name).toBe('Outra Empresa');
      expect(result.slug).toBe('outra-empresa');
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return tenant with relations by id', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenantWithRelations);

      const result = await service.findById('tenant-1');

      expect(result.id).toBe('tenant-1');
      expect(result.name).toBe('Empresa Teste');
      expect(result.users).toHaveLength(2);
      expect(result.contractTemplates).toHaveLength(1);
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              active: true,
            },
          },
          contractTemplates: {
            where: { active: true },
            take: 1,
          },
        },
      });
    });

    it('should throw NotFoundException when tenant does not exist', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('nonexistent')).rejects.toThrow(
        'Tenant não encontrado',
      );
    });

    it('should include users and templates information', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenantWithRelations);

      const result = await service.findById('tenant-1');

      expect(result.users[0].email).toBe('admin@example.com');
      expect(result.users[0].role).toBe('ADMIN');
      expect(result.contractTemplates[0].name).toBe('Template Padrão');
    });
  });

  // ─── findBySlug ──────────────────────────────────────────────────────────

  describe('findBySlug', () => {
    it('should return tenant by slug', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findBySlug('empresa-teste');

      expect(result.id).toBe('tenant-1');
      expect(result.slug).toBe('empresa-teste');
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: 'empresa-teste' },
      });
    });

    it('should throw NotFoundException when tenant slug does not exist', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent-slug')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findBySlug('nonexistent-slug')).rejects.toThrow(
        'Tenant não encontrado',
      );
    });

    it('should handle different slugs', async () => {
      const differentTenant = {
        id: 'tenant-2',
        name: 'Outra Empresa',
        slug: 'outra-empresa',
      };
      mockPrisma.tenant.findUnique.mockResolvedValue(differentTenant);

      const result = await service.findBySlug('outra-empresa');

      expect(result.slug).toBe('outra-empresa');
      expect(result.name).toBe('Outra Empresa');
    });
  });

  // ─── getCurrentTenant ────────────────────────────────────────────────────

  describe('getCurrentTenant', () => {
    it('should return current tenant info by id', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenantWithRelations);

      const result = await service.getCurrentTenant('tenant-1');

      expect(result.id).toBe('tenant-1');
      expect(result.users).toBeDefined();
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              active: true,
            },
          },
          contractTemplates: {
            where: { active: true },
            take: 1,
          },
        },
      });
    });

    it('should throw NotFoundException if tenant does not exist', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.getCurrentTenant('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include full tenant information with relations', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenantWithRelations);

      const result = await service.getCurrentTenant('tenant-1');

      expect(result.users).toHaveLength(2);
      expect(result.users[0]).toHaveProperty('role');
      expect(result.users[0]).toHaveProperty('active');
    });
  });
});

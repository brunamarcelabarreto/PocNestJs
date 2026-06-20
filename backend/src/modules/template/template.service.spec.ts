import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TemplateService } from './template.service';
import { PrismaService } from '../../common/prisma/prisma.service';

const mockPrisma: any = {
  contractTemplate: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
};
mockPrisma.$transaction = jest.fn((cb: (tx: any) => any) => cb(mockPrisma));

const TENANT_ID = 'tenant-1';

const mockTemplate = {
  id: 'template-1',
  tenantId: TENANT_ID,
  name: 'Contrato Padrão',
  version: 1,
  active: true,
  fields: [
    { id: 'field-1', name: 'Nome', fieldType: 'TEXT', required: true, order: 0 },
    { id: 'field-2', name: 'Valor', fieldType: 'NUMBER', required: false, order: 1 },
  ],
};

describe('TemplateService', () => {
  let service: TemplateService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
  });

  describe('create', () => {
    it('should create template with fields', async () => {
      mockPrisma.contractTemplate.create.mockResolvedValue(mockTemplate);

      const result = await service.create(TENANT_ID, {
        name: 'Contrato Padrão',
        fields: [
          { name: 'Nome', fieldType: 'TEXT' as any, required: true, order: 0 },
          { name: 'Valor', fieldType: 'NUMBER' as any, required: false, order: 1 },
        ],
      });

      expect(result.name).toBe('Contrato Padrão');
      expect(mockPrisma.contractTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: TENANT_ID, active: true, version: 1 }),
        }),
      );
    });

    it('should throw BadRequestException if name is empty', async () => {
      await expect(
        service.create(TENANT_ID, { name: '  ', fields: [] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getActiveTemplate', () => {
    it('should return active template', async () => {
      mockPrisma.contractTemplate.findFirst.mockResolvedValue(mockTemplate);

      const result = await service.getActiveTemplate(TENANT_ID);

      expect(result.id).toBe('template-1');
      expect(mockPrisma.contractTemplate.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: TENANT_ID, active: true } }),
      );
    });

    it('should throw NotFoundException if no active template', async () => {
      mockPrisma.contractTemplate.findFirst.mockResolvedValue(null);

      await expect(service.getActiveTemplate(TENANT_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should create new version and deactivate old template', async () => {
      mockPrisma.contractTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.contractTemplate.update.mockResolvedValue({ ...mockTemplate, active: false });
      const newTemplate = { ...mockTemplate, id: 'template-2', version: 2 };
      mockPrisma.contractTemplate.create.mockResolvedValue(newTemplate);

      const result = await service.update('template-1', TENANT_ID, {
        name: 'Contrato v2',
        fields: [{ name: 'Nome', fieldType: 'TEXT' as any, required: true, order: 0 }],
      });

      expect(result.version).toBe(2);
      expect(mockPrisma.contractTemplate.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { active: false } }),
      );
    });

    it('should throw NotFoundException if template belongs to different tenant', async () => {
      mockPrisma.contractTemplate.findUnique.mockResolvedValue({
        ...mockTemplate,
        tenantId: 'other-tenant',
      });

      await expect(
        service.update('template-1', TENANT_ID, { name: 'x', fields: [] }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

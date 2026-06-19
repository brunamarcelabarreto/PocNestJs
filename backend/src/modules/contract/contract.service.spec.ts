import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ContractService } from './contract.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { HistoryService } from '../history/history.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma: any = {
  contractTemplate: { findUnique: jest.fn() },
  contract: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  contractField: { updateMany: jest.fn() },
};
mockPrisma.$transaction = jest.fn((cb: (tx: any) => any) => cb(mockPrisma));

const mockHistoryService = {
  createAuditLog: jest.fn().mockResolvedValue({}),
};

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-1';
const TEMPLATE_ID = 'template-1';

const mockTemplate = {
  id: TEMPLATE_ID,
  tenantId: TENANT_ID,
  name: 'Contrato Padrão',
  fields: [
    { id: 'field-1', name: 'Nome do Cliente', fieldType: 'TEXT', required: true },
    { id: 'field-2', name: 'Valor', fieldType: 'NUMBER', required: false },
  ],
};

const mockContract = {
  id: 'contract-1',
  tenantId: TENANT_ID,
  templateId: TEMPLATE_ID,
  title: 'Contrato Teste',
  status: 'DRAFT',
  fields: [
    { id: 'cf-1', fieldId: 'field-1', value: 'João Silva', contractId: 'contract-1', field: mockTemplate.fields[0] },
  ],
  template: mockTemplate,
  createdByUser: { id: USER_ID, name: 'Admin', email: 'admin@test.com' },
  createdAt: new Date(),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('ContractService', () => {
  let service: ContractService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: HistoryService, useValue: mockHistoryService },
      ],
    }).compile();

    service = module.get<ContractService>(ContractService);
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create contract and log audit', async () => {
      mockPrisma.contractTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.contract.create.mockResolvedValue(mockContract);

      const result = await service.create(
        TENANT_ID,
        TEMPLATE_ID,
        'Contrato Teste',
        { 'field-1': 'João Silva' },
        USER_ID,
      );

      expect(result.id).toBe('contract-1');
      expect(mockHistoryService.createAuditLog).toHaveBeenCalledWith(
        'contract-1',
        TENANT_ID,
        USER_ID,
        'CONTRACT_CREATED',
        undefined,
        undefined,
        undefined,
        expect.stringContaining('Contrato criado'),
      );
    });

    it('should throw NotFoundException if template not found', async () => {
      mockPrisma.contractTemplate.findUnique.mockResolvedValue(null);

      await expect(
        service.create(TENANT_ID, 'wrong-template', 'Título', {}, USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if template belongs to different tenant', async () => {
      mockPrisma.contractTemplate.findUnique.mockResolvedValue({
        ...mockTemplate,
        tenantId: 'other-tenant',
      });

      await expect(
        service.create(TENANT_ID, TEMPLATE_ID, 'Título', {}, USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for missing required field', async () => {
      mockPrisma.contractTemplate.findUnique.mockResolvedValue(mockTemplate);

      await expect(
        service.create(TENANT_ID, TEMPLATE_ID, 'Título', {}, USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid NUMBER field', async () => {
      mockPrisma.contractTemplate.findUnique.mockResolvedValue(mockTemplate);

      await expect(
        service.create(
          TENANT_ID,
          TEMPLATE_ID,
          'Título',
          { 'field-1': 'João', 'field-2': 'não-é-número' },
          USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── list ────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('should return paginated contracts', async () => {
      mockPrisma.contract.findMany.mockResolvedValue([mockContract]);
      mockPrisma.contract.count.mockResolvedValue(1);

      const result = await service.list(TENANT_ID);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.pages).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrisma.contract.findMany.mockResolvedValue([]);
      mockPrisma.contract.count.mockResolvedValue(0);

      await service.list(TENANT_ID, 'ACTIVE');

      expect(mockPrisma.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'ACTIVE' }) }),
      );
    });

    it('should apply search filter', async () => {
      mockPrisma.contract.findMany.mockResolvedValue([]);
      mockPrisma.contract.count.mockResolvedValue(0);

      await service.list(TENANT_ID, undefined, undefined, undefined, 'João');

      const call = mockPrisma.contract.findMany.mock.calls[0][0];
      expect(call.where.OR).toBeDefined();
    });
  });

  // ─── activate ────────────────────────────────────────────────────────────

  describe('activate', () => {
    it('should activate a DRAFT contract', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({ ...mockContract, status: 'DRAFT' });
      mockPrisma.contract.update.mockResolvedValue({ ...mockContract, status: 'ACTIVE' });

      await service.activate('contract-1', TENANT_ID, USER_ID);

      expect(mockPrisma.contract.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'ACTIVE' }) }),
      );
      expect(mockHistoryService.createAuditLog).toHaveBeenCalledWith(
        'contract-1', TENANT_ID, USER_ID, 'CONTRACT_ACTIVATED',
        undefined, 'DRAFT', 'ACTIVE', expect.any(String),
      );
    });

    it('should throw BadRequestException if contract is not DRAFT', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({ ...mockContract, status: 'ACTIVE' });

      await expect(service.activate('contract-1', TENANT_ID, USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── close ───────────────────────────────────────────────────────────────

  describe('close', () => {
    it('should close an ACTIVE contract', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({ ...mockContract, status: 'ACTIVE' });
      mockPrisma.contract.update.mockResolvedValue({ ...mockContract, status: 'CLOSED' });

      await service.close('contract-1', TENANT_ID, USER_ID);

      expect(mockPrisma.contract.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'CLOSED' }) }),
      );
      expect(mockHistoryService.createAuditLog).toHaveBeenCalledWith(
        'contract-1', TENANT_ID, USER_ID, 'CONTRACT_CLOSED',
        undefined, 'ACTIVE', 'CLOSED', expect.any(String),
      );
    });

    it('should throw BadRequestException if contract is not ACTIVE', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({ ...mockContract, status: 'DRAFT' });

      await expect(service.close('contract-1', TENANT_ID, USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

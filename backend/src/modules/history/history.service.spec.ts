import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HistoryService } from './history.service';
import { PrismaService } from '../../common/prisma/prisma.service';

const mockPrisma: any = {
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  contract: {
    findUnique: jest.fn(),
  },
};
mockPrisma.$transaction = jest.fn((cb: (tx: any) => any) => cb(mockPrisma));

const TENANT_ID = 'tenant-1';
const CONTRACT_ID = 'contract-1';
const USER_ID = 'user-1';

const mockAuditLog = {
  id: 'log-1',
  contractId: CONTRACT_ID,
  tenantId: TENANT_ID,
  userId: USER_ID,
  action: 'CREATED',
  fieldName: null,
  oldValue: null,
  newValue: null,
  description: 'Contrato criado',
  createdAt: new Date('2026-06-19'),
  updatedAt: new Date('2026-06-19'),
  user: {
    id: USER_ID,
    name: 'João Silva',
    email: 'joao@example.com',
  },
};

const mockContract = {
  id: CONTRACT_ID,
  tenantId: TENANT_ID,
  name: 'Contrato Teste',
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('HistoryService', () => {
  let service: HistoryService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<HistoryService>(HistoryService);
  });

  // ─── createAuditLog ──────────────────────────────────────────────────────

  describe('createAuditLog', () => {
    it('should create an audit log with all fields', async () => {
      mockPrisma.auditLog.create.mockResolvedValue(mockAuditLog);

      const result = await service.createAuditLog(
        CONTRACT_ID,
        TENANT_ID,
        USER_ID,
        'CREATED',
        undefined,
        undefined,
        undefined,
        'Contrato criado',
      );

      expect(result.id).toBe('log-1');
      expect(result.action).toBe('CREATED');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          contractId: CONTRACT_ID,
          tenantId: TENANT_ID,
          userId: USER_ID,
          action: 'CREATED',
          fieldName: undefined,
          oldValue: undefined,
          newValue: undefined,
          description: 'Contrato criado',
        },
        include: {
          user: { select: { name: true, email: true } },
        },
      });
    });

    it('should create an audit log for field update', async () => {
      const updateLog = {
        ...mockAuditLog,
        action: 'UPDATED',
        fieldName: 'status',
        oldValue: 'DRAFT',
        newValue: 'ACTIVE',
      };

      mockPrisma.auditLog.create.mockResolvedValue(updateLog);

      const result = await service.createAuditLog(
        CONTRACT_ID,
        TENANT_ID,
        USER_ID,
        'UPDATED',
        'status',
        'DRAFT',
        'ACTIVE',
      );

      expect(result.fieldName).toBe('status');
      expect(result.oldValue).toBe('DRAFT');
      expect(result.newValue).toBe('ACTIVE');
    });
  });

  // ─── getContractHistory ──────────────────────────────────────────────────

  describe('getContractHistory', () => {
    it('should return contract history ordered by createdAt asc', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(mockContract);
      mockPrisma.auditLog.findMany.mockResolvedValue([mockAuditLog]);

      const result = await service.getContractHistory(CONTRACT_ID, TENANT_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('log-1');
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { contractId: CONTRACT_ID, tenantId: TENANT_ID },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should throw NotFoundException if contract does not exist', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(null);

      await expect(
        service.getContractHistory(CONTRACT_ID, TENANT_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if contract does not belong to tenant', async () => {
      const differentTenant = { ...mockContract, tenantId: 'different-tenant' };
      mockPrisma.contract.findUnique.mockResolvedValue(differentTenant);

      await expect(
        service.getContractHistory(CONTRACT_ID, TENANT_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getContractHistoryPaginated ────────────────────────────────────────

  describe('getContractHistoryPaginated', () => {
    it('should return paginated history with correct pagination metadata', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(mockContract);
      mockPrisma.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      mockPrisma.auditLog.count.mockResolvedValue(25);

      const result = await service.getContractHistoryPaginated(
        CONTRACT_ID,
        TENANT_ID,
        1,
        20,
      );

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.pages).toBe(2);
    });

    it('should use correct skip and take values for pagination', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(mockContract);
      mockPrisma.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      mockPrisma.auditLog.count.mockResolvedValue(50);

      await service.getContractHistoryPaginated(
        CONTRACT_ID,
        TENANT_ID,
        2,
        10,
      );

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { contractId: CONTRACT_ID, tenantId: TENANT_ID },
        skip: 10,
        take: 10,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should use default pagination values', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(mockContract);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const result = await service.getContractHistoryPaginated(
        CONTRACT_ID,
        TENANT_ID,
      );

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should throw NotFoundException if contract does not exist', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(null);

      await expect(
        service.getContractHistoryPaginated(CONTRACT_ID, TENANT_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if contract does not belong to tenant', async () => {
      const differentTenant = { ...mockContract, tenantId: 'different-tenant' };
      mockPrisma.contract.findUnique.mockResolvedValue(differentTenant);

      await expect(
        service.getContractHistoryPaginated(CONTRACT_ID, TENANT_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

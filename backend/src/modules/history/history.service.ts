import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class HistoryService {
  constructor(private prisma: PrismaService) { }

  async createAuditLog(
    contractId: string,
    tenantId: string,
    userId: string,
    action: string,
    fieldName?: string,
    oldValue?: string,
    newValue?: string,
    description?: string,
  ) {
    return await this.prisma.auditLog.create({
      data: {
        contractId,
        tenantId,
        userId,
        action: action as any,
        fieldName,
        oldValue,
        newValue,
        description,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });
  }

  async getContractHistory(contractId: string, tenantId: string) {
    // Valida se contrato pertence ao tenant
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract || contract.tenantId !== tenantId) {
      throw new NotFoundException('Contrato não encontrado');
    }

    return await this.prisma.auditLog.findMany({
      where: { contractId, tenantId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getContractHistoryPaginated(
    contractId: string,
    tenantId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract || contract.tenantId !== tenantId) {
      throw new NotFoundException('Contrato não encontrado');
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { contractId, tenantId },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({
        where: { contractId, tenantId },
      }),
    ]);

    return {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

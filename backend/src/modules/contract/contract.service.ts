import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { HistoryService } from '../history/history.service';

@Injectable()
export class ContractService {
  constructor(
    private prisma: PrismaService,
    private historyService: HistoryService,
  ) { }

  private validateFieldValue(fieldType: string, value: any): void {
    if (value === null || value === undefined || value === '') {
      return; // Já validado obrigatoriedade antes
    }

    const stringValue = value?.toString().trim();

    switch (fieldType) {
      case 'NUMBER':
        if (isNaN(parseFloat(stringValue))) {
          throw new BadRequestException(`Campo número deve conter um valor numérico válido`);
        }
        break;

      case 'DATE':
        const date = new Date(stringValue);
        if (isNaN(date.getTime())) {
          throw new BadRequestException(`Campo data deve conter uma data válida (YYYY-MM-DD)`);
        }
        break;

      case 'EMAIL':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(stringValue)) {
          throw new BadRequestException(`Campo email deve conter um email válido`);
        }
        break;

      case 'PHONE':
        const phoneRegex = /^[\d\s+\-()]+$/;
        if (!phoneRegex.test(stringValue) || stringValue.replace(/\D/g, '').length < 10) {
          throw new BadRequestException(`Campo telefone deve conter um número válido`);
        }
        break;

      case 'BOOLEAN':
        const boolValue = stringValue.toLowerCase();
        if (!['true', 'false', '1', '0', 'sim', 'não', 'yes', 'no'].includes(boolValue)) {
          throw new BadRequestException(`Campo booleano deve ser true/false`);
        }
        break;

      case 'TEXT':
      case 'TEXTAREA':
        // Apenas valida se é string
        if (typeof stringValue !== 'string') {
          throw new BadRequestException(`Campo texto deve conter texto válido`);
        }
        break;
    }
  }

  async create(tenantId: string, templateId: string, title: string, fields: Record<string, any>, userId: string) {
    const template = await this.prisma.contractTemplate.findUnique({
      where: { id: templateId },
      include: { fields: true },
    });

    if (!template || template.tenantId !== tenantId) {
      throw new NotFoundException('Template não encontrado');
    }

    const requiredFields = template.fields.filter(f => f.required);
    for (const requiredField of requiredFields) {
      if (!fields[requiredField.id] || fields[requiredField.id].trim() === '') {
        throw new BadRequestException(`Campo obrigatório não preenchido: ${requiredField.name}`);
      }
    }

    // Validar tipos de campos
    for (const templateField of template.fields) {
      if (fields[templateField.id]) {
        this.validateFieldValue(templateField.fieldType, fields[templateField.id]);
      }
    }

    const contract = await this.prisma.$transaction(async (tx) => {
      const newContract = await tx.contract.create({
        data: {
          title,
          tenantId,
          templateId,
          createdBy: userId,
          status: 'DRAFT',
          fields: {
            create: Object.entries(fields).map(([fieldId, value]) => ({
              fieldId,
              value: value?.toString(),
            })),
          },
        },
        include: {
          fields: {
            include: { field: true },
          },
          createdByUser: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return newContract;
    });

    // Registrar no histórico após commit da transaction
    await this.historyService.createAuditLog(
      contract.id,
      tenantId,
      userId,
      'CONTRACT_CREATED',
      undefined,
      undefined,
      undefined,
      `Contrato criado: ${title}`,
    );

    return contract;
  }

  async getById(id: string, tenantId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        fields: {
          include: { field: true },
        },
        template: {
          include: { fields: true },
        },
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        updatedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!contract || contract.tenantId !== tenantId) {
      throw new NotFoundException('Contrato não encontrado');
    }

    return contract;
  }

  async list(
    tenantId: string,
    status?: string,
    startDate?: Date,
    endDate?: Date,
    search?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const where: any = { tenantId };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Filtro por busca em valores de campos
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          fields: {
            some: {
              value: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        include: {
          template: { select: { name: true } },
          createdByUser: { select: { name: true } },
          fields: {
            include: { field: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return {
      data: contracts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, tenantId: string, data: any, userId: string) {
    const contract = await this.getById(id, tenantId);

    if (contract.status !== 'DRAFT') {
      throw new BadRequestException('Apenas contratos em rascunho podem ser editados');
    }

    // Validar tipos de campos se houver atualização
    if (data.fields) {
      const template = contract.template;
      for (const templateField of template.fields) {
        if (data.fields[templateField.id]) {
          this.validateFieldValue(templateField.fieldType, data.fields[templateField.id]);
        }
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.contract.update({
        where: { id },
        data: {
          title: data.title || contract.title,
          description: data.description || contract.description,
          updatedBy: userId,
        },
        include: {
          fields: { include: { field: true } },
        },
      });

      if (data.fields) {
        for (const [fieldId, value] of Object.entries(data.fields)) {
          await tx.contractField.updateMany({
            where: { contractId: id, fieldId },
            data: { value: value?.toString() },
          });
        }
      }

      return result;
    });

    // Registrar histórico após commit da transaction
    if (data.fields) {
      for (const [fieldId, value] of Object.entries(data.fields)) {
        const oldField = contract.fields.find(f => f.fieldId === fieldId);
        await this.historyService.createAuditLog(
          id,
          tenantId,
          userId,
          'FIELD_UPDATED',
          fieldId,
          oldField?.value ?? undefined,
          value?.toString(),
          `Campo atualizado`,
        );
      }
    }

    if (data.title !== contract.title || data.description !== contract.description) {
      await this.historyService.createAuditLog(
        id,
        tenantId,
        userId,
        'CONTRACT_UPDATED',
        undefined,
        undefined,
        undefined,
        `Contrato atualizado`,
      );
    }

    return updated;
  }

  async activate(id: string, tenantId: string, userId: string) {
    const contract = await this.getById(id, tenantId);

    if (contract.status !== 'DRAFT') {
      throw new BadRequestException('Apenas rascunhos podem ser ativados');
    }

    const activated = await this.prisma.$transaction(async (tx) => {
      return await tx.contract.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          activatedAt: new Date(),
          updatedBy: userId,
        },
      });
    });

    await this.historyService.createAuditLog(
      id,
      tenantId,
      userId,
      'CONTRACT_ACTIVATED',
      undefined,
      'DRAFT',
      'ACTIVE',
      `Contrato ativado`,
    );

    return activated;
  }

  async close(id: string, tenantId: string, userId: string) {
    const contract = await this.getById(id, tenantId);

    if (contract.status !== 'ACTIVE') {
      throw new BadRequestException('Apenas contratos ativos podem ser encerrados');
    }

    const closed = await this.prisma.$transaction(async (tx) => {
      return await tx.contract.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          updatedBy: userId,
        },
      });
    });

    await this.historyService.createAuditLog(
      id,
      tenantId,
      userId,
      'CONTRACT_CLOSED',
      undefined,
      'ACTIVE',
      'CLOSED',
      `Contrato encerrado`,
    );

    return closed;
  }
}

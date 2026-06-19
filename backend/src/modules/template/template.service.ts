import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto, TemplateFieldDto } from './dto/template.dto';

@Injectable()
export class TemplateService {
  constructor(private prisma: PrismaService) { }

  async create(tenantId: string, createTemplateDto: CreateTemplateDto) {
    if (!createTemplateDto.name || createTemplateDto.name.trim().length === 0) {
      throw new BadRequestException('Nome do template é obrigatório');
    }

    return await this.prisma.contractTemplate.create({
      data: {
        name: createTemplateDto.name,
        version: 1,
        active: true,
        tenantId,
        fields: {
          create: createTemplateDto.fields.map((field, index) => ({
            name: field.name,
            fieldType: field.fieldType,
            required: field.required || false,
            placeholder: field.placeholder,
            defaultValue: field.defaultValue,
            order: index,
          })),
        },
      },
      include: { fields: true },
    });
  }

  async getActiveTemplate(tenantId: string) {
    const template = await this.prisma.contractTemplate.findFirst({
      where: {
        tenantId,
        active: true,
      },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Nenhum template ativo encontrado para este tenant');
    }

    return template;
  }

  async getById(id: string, tenantId: string) {
    const template = await this.prisma.contractTemplate.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    if (template.tenantId !== tenantId) {
      throw new NotFoundException('Template não encontrado');
    }

    return template;
  }

  async update(id: string, tenantId: string, updateTemplateDto: UpdateTemplateDto) {
    const template = await this.getById(id, tenantId);

    return await this.prisma.$transaction(async (tx) => {
      await tx.contractTemplate.update({
        where: { id },
        data: { active: false },
      });

      const newTemplate = await tx.contractTemplate.create({
        data: {
          name: updateTemplateDto.name || template.name,
          version: template.version + 1,
          active: true,
          tenantId,
          fields: {
            create: (updateTemplateDto.fields || []).map((field: TemplateFieldDto, index: number) => ({
              name: field.name,
              fieldType: field.fieldType,
              required: field.required || false,
              placeholder: field.placeholder,
              defaultValue: field.defaultValue,
              order: index,
            })),
          },
        },
        include: { fields: true },
      });

      return newTemplate;
    });
  }

  async listByTenant(tenantId: string) {
    return await this.prisma.contractTemplate.findMany({
      where: { tenantId },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

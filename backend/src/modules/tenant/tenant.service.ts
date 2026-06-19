import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) { }

  /**
   * Cria um novo tenant
   */
  async create(name: string, slug: string) {
    return await this.prisma.tenant.create({
      data: {
        name,
        slug,
      },
    });
  }

  /**
   * Encontra tenant pelo ID
   */
  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
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

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    return tenant;
  }

  /**
   * Encontra tenant pelo slug
   */
  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    return tenant;
  }

  /**
   * Obtém informações do tenant atual
   */
  async getCurrentTenant(tenantId: string) {
    return await this.findById(tenantId);
  }
}

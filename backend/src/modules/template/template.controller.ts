import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { TemplateService } from './template.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@Controller('api/templates')
@UseGuards(JwtGuard)
export class TemplateController {
  constructor(private templateService: TemplateService) { }

  @Get()
  async list(@CurrentTenant() tenantId: string) {
    return this.templateService.listByTenant(tenantId);
  }

  @Get('active')
  async getActive(@CurrentTenant() tenantId: string) {
    return this.templateService.getActiveTemplate(tenantId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(@CurrentTenant() tenantId: string, @Body() dto: CreateTemplateDto) {
    return this.templateService.create(tenantId, dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templateService.update(id, tenantId, dto);
  }
}

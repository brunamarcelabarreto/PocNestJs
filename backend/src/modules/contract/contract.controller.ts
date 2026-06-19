import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContractService } from './contract.service';
import { CreateContractDto, UpdateContractDto, ContractListQueryDto } from './dto/contract.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/contracts')
@UseGuards(JwtGuard)
export class ContractController {
  constructor(private contractService: ContractService) { }

  @Get()
  async list(
    @CurrentTenant() tenantId: string,
    @Query() query: ContractListQueryDto,
  ) {
    return this.contractService.list(
      tenantId,
      query.status,
      query.startDate,
      query.endDate,
      query.search,
      query.page,
      query.limit,
    );
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateContractDto,
    @CurrentUser() user: any,
  ) {
    return this.contractService.create(tenantId, dto.templateId, dto.title, dto.fields, user.sub);
  }

  @Get(':id')
  async getById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.contractService.getById(id, tenantId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
    @CurrentUser() user: any,
  ) {
    return this.contractService.update(id, tenantId, dto, user.sub);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async activate(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.contractService.activate(id, tenantId, user.sub);
  }

  @Patch(':id/close')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async close(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.contractService.close(id, tenantId, user.sub);
  }
}

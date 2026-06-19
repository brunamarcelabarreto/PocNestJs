import { Controller, Get, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@Controller('api/tenants')
export class TenantController {
  constructor(private tenantService: TenantService) { }

  @Get('me')
  @UseGuards(JwtGuard)
  async getCurrentTenant(@CurrentTenant() tenantId: string) {
    return this.tenantService.getCurrentTenant(tenantId);
  }
}

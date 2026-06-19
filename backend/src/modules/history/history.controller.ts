import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@Controller('api/contracts/:contractId/history')
@UseGuards(JwtGuard)
export class HistoryController {
  constructor(private historyService: HistoryService) { }

  @Get()
  async getHistory(
    @Param('contractId') contractId: string,
    @CurrentTenant() tenantId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.historyService.getContractHistoryPaginated(
      contractId,
      tenantId,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
  }
}

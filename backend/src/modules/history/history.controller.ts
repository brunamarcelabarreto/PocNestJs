import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { DEFAULT_HISTORY_PAGE_LIMIT } from '../../common/constants/pagination.constants';

@Controller('api/contracts/:contractId/history')
@UseGuards(JwtGuard)
export class HistoryController {
  constructor(private historyService: HistoryService) { }

  @Get()
  async getHistory(
    @Param('contractId') contractId: string,
    @CurrentTenant() tenantId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = String(DEFAULT_HISTORY_PAGE_LIMIT),
  ) {
    return this.historyService.getContractHistoryPaginated(
      contractId,
      tenantId,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || DEFAULT_HISTORY_PAGE_LIMIT,
    );
  }
}

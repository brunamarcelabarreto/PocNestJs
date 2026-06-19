import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [PrismaModule, HistoryModule],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule { }

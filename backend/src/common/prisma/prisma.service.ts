import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService implements OnModuleInit {
  private prisma: PrismaClient;

  constructor(private configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  get user() {
    return this.prisma.user;
  }

  get tenant() {
    return this.prisma.tenant;
  }

  get contract() {
    return this.prisma.contract;
  }

  get contractTemplate() {
    return this.prisma.contractTemplate;
  }

  get templateField() {
    return this.prisma.templateField;
  }

  get contractField() {
    return this.prisma.contractField;
  }

  get auditLog() {
    return this.prisma.auditLog;
  }

  get refreshToken() {
    return this.prisma.refreshToken;
  }

  get $transaction() {
    return this.prisma.$transaction.bind(this.prisma);
  }
}

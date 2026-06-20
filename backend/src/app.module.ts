import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { ContractModule } from './modules/contract/contract.module';
import { HistoryModule } from './modules/history/history.module';
import { TemplateModule } from './modules/template/template.module';
import { NoCacheMiddleware } from './common/middleware/no-cache.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? undefined : '.env',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRATION', '3600s') },
      }),
    }),
    PrismaModule,
    AuthModule,
    TenantModule,
    TemplateModule,
    ContractModule,
    HistoryModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(NoCacheMiddleware).forRoutes('*');
  }
}

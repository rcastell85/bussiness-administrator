import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TenantsModule } from './tenants/tenants.module';
import { AuthModule } from './auth/auth.module';
import { TenantMiddleware } from './tenants/tenant.middleware';
import { RatesModule } from './rates/rates.module';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { SalesModule } from './sales/sales.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [PrismaModule, TenantsModule, AuthModule, RatesModule, ProductsModule, CustomersModule, SalesModule, ReportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'auth/*path', method: RequestMethod.ALL },

        { path: 'tenants', method: RequestMethod.POST },
        { path: 'rates/global', method: RequestMethod.ALL },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

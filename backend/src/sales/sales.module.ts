import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { RatesModule } from '../rates/rates.module';
import { ProductsModule } from '../products/products.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [TenantsModule, RatesModule, ProductsModule, CustomersModule],
  providers: [SalesService],
  controllers: [SalesController],
})
export class SalesModule { }


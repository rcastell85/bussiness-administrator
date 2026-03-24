import { Module } from '@nestjs/common';
import { RatesService } from './rates.service';
import { RatesController } from './rates.controller';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TenantsModule],
  providers: [RatesService],
  controllers: [RatesController],
  exports: [RatesService],
})
export class RatesModule { }


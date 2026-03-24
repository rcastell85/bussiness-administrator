import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TenantsModule],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule { }


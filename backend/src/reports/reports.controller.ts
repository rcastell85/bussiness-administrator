import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('summary')
    async getSummary(
        @Query('start') start?: string,
        @Query('end') end?: string,
    ) {
        if (start && end) {
            return this.reportsService.getSalesSummary(new Date(start), new Date(end));
        }
        return this.reportsService.getCashFlowSummary();
    }
}

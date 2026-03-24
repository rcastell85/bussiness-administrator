import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class ReportsService {
    constructor(
        private prisma: PrismaService,
        private tenantsService: TenantsService,
    ) { }

    async getSalesSummary(startDate: Date, endDate: Date) {
        const tenantId = this.tenantsService.getTenantId();

        const stats = await this.prisma.sale.aggregate({
            where: {
                tenantId,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                totalUsd: true,
                totalVes: true,
            },
            _count: {
                id: true,
            },
        });

        return {
            totalUsd: stats._sum.totalUsd || 0,
            totalVes: stats._sum.totalVes || 0,
            count: stats._count.id,
            startDate,
            endDate,
        };
    }

    async getCashFlowSummary() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        return this.getSalesSummary(today, tomorrow);
    }
}

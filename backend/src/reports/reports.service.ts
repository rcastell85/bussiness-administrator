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

    async getPerformanceReport(startDate: Date, endDate: Date) {
        const tenantId = this.tenantsService.getTenantId();

        // 1. Get Tenant Info
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { name: true, rif: true }
        });

        // 2. Sales Summary (already implemented, but we take it here too)
        const summary = await this.getSalesSummary(startDate, endDate);

        // 3. Sales per Product (Involved SaleItems)
        const saleItems = await this.prisma.saleItem.findMany({
            where: {
                sale: {
                    tenantId,
                    createdAt: { gte: startDate, lte: endDate }
                }
            },
            include: {
                product: { select: { name: true } }
            }
        });

        // Manual aggregation of sales per product
        const productsMap = new Map();
        saleItems.forEach(item => {
            const current = productsMap.get(item.productId) || { name: item.product.name, count: 0, total: 0 };
            current.count += Number(item.cantidad);
            // Approximation of total USD for this specific product in the period
            current.total += Number(item.cantidad) * Number(item.precioUnitarioUsd);
            productsMap.set(item.productId, current);
        });
        const productSales = Array.from(productsMap.values()).sort((a,b) => b.count - a.count);

        // 4. Payment Method Distribution
        const sales = await this.prisma.sale.findMany({
            where: {
                tenantId,
                createdAt: { gte: startDate, lte: endDate }
            }
        });

        const paymentMap = new Map();
        sales.forEach(sale => {
            const current = paymentMap.get(sale.paymentMethod) || { count: 0, totalUsd: 0, totalVes: 0 };
            current.count += 1;
            current.totalUsd += Number(sale.totalUsd);
            current.totalVes += Number(sale.totalVes);
            paymentMap.set(sale.paymentMethod, current);
        });
        const paymentMethods = Array.from(paymentMap.entries()).map(([method, stats]) => ({ method, ...stats }));

        // 5. Supply Inflow (Entries)
        const supplyEntries = await this.prisma.supplyHistory.findMany({
            where: {
                supplyItem: { tenantId },
                type: 'ENTRY',
                createdAt: { gte: startDate, lte: endDate }
            },
            include: {
                supplyItem: { select: { name: true, unit: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // 6. Current Inventory (Products)
        const inventory = await this.prisma.product.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
            select: { name: true, stockActual: true }
        });

        return {
            tenant,
            summary,
            productSales,
            paymentMethods,
            supplyEntries: supplyEntries.map(e => ({
                id: e.id,
                name: e.supplyItem.name,
                unit: e.supplyItem.unit,
                quantity: e.quantity,
                note: e.note,
                date: e.createdAt
            })),
            inventory
        };
    }
}

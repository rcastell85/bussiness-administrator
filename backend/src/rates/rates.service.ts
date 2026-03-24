import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class RatesService implements OnModuleInit {
    constructor(
        private prisma: PrismaService,
        private tenantsService: TenantsService,
    ) { }

    async onModuleInit() {
        // Initialize global rate if it doesn't exist
        const global = await this.prisma.globalConfig.findUnique({ where: { id: 'global' } });
        if (!global) {
            await this.prisma.globalConfig.create({
                data: { id: 'global', bcvRate: 36.5 }, // Default initial rate
            });
        }
    }

    async getGlobalRate() {
        return this.prisma.globalConfig.findUnique({ where: { id: 'global' } });
    }

    async updateGlobalRate(rate: number) {
        return this.prisma.globalConfig.update({
            where: { id: 'global' },
            data: { bcvRate: rate },
        });
    }

    async getApplicableRate() {
        const tenantId = this.tenantsService.getTenantId();
        if (!tenantId) return this.getGlobalRate();

        const tenant = await this.tenantsService.findOne(tenantId);
        const config = tenant.configJson as any;

        if (config?.customRate) {
            return { bcvRate: config.customRate, isCustom: true };
        }

        return this.getGlobalRate();
    }

    async updateTenantRate(rate: number) {
        const tenantId = this.tenantsService.getTenantId();
        const tenant = await this.tenantsService.findOne(tenantId);
        const config = (tenant.configJson as any) || {};

        return this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                configJson: {
                    ...config,
                    customRate: rate,
                },
            },
        });
    }
}

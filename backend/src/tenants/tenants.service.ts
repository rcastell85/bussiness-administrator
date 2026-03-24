import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { tenantContext } from './tenant.context';

@Injectable()
export class TenantsService {
    constructor(private prisma: PrismaService) { }

    getTenantId(): string {
        const context = tenantContext.getStore();
        return context?.tenantId as string;
    }


    async create(data: { name: string; rif?: string; configJson?: any }) {
        return this.prisma.tenant.create({
            data,
        });
    }

    async findOne(id: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
        });
        if (!tenant) {
            throw new NotFoundException(`Tenant with ID ${id} not found`);
        }
        return tenant;
    }

    async findAll() {
        return this.prisma.tenant.findMany();
    }

    async getGlobalConfig() {
        return this.prisma.globalConfig.findUnique({ where: { id: 'global' } });
    }
}

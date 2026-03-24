import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class ProductsService {
    constructor(
        private prisma: PrismaService,
        private tenantsService: TenantsService,
    ) { }

    async create(data: { name: string; priceBaseUsd: number; stockActual: number; imageUrl?: string }) {
        const tenantId = this.tenantsService.getTenantId();
        return this.prisma.product.create({
            data: {
                ...data,
                tenantId,
            },
        });
    }

    async findAll(sortBy?: string) {
        const tenantId = this.tenantsService.getTenantId();
        
        let orderBy: any = { name: 'asc' };
        if (sortBy === 'sales') {
            orderBy = { saleItems: { _count: 'desc' } };
        }

        return this.prisma.product.findMany({
            where: { tenantId },
            orderBy,
        });
    }

    async findOne(id: string) {
        const tenantId = this.tenantsService.getTenantId();
        const product = await this.prisma.product.findFirst({
            where: { id, tenantId },
        });
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
        return product;
    }

    async update(id: string, data: { name?: string; priceBaseUsd?: number; stockActual?: number; imageUrl?: string }) {
        const tenantId = this.tenantsService.getTenantId();
        // Ensure product belongs to tenant
        await this.findOne(id);

        return this.prisma.product.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        const tenantId = this.tenantsService.getTenantId();
        // Ensure product belongs to tenant
        await this.findOne(id);

        return this.prisma.product.delete({
            where: { id },
        });
    }

    async transform(data: {
        sourceProductId: string;
        sourceQuantity: number;
        targetProductId: string;
        targetQuantity: number;
    }) {
        const tenantId = this.tenantsService.getTenantId();

        return this.prisma.$transaction(async (tx) => {
            const source = await tx.product.findFirst({
                where: { id: data.sourceProductId, tenantId },
            });
            const target = await tx.product.findFirst({
                where: { id: data.targetProductId, tenantId },
            });

            if (!source || !target) {
                throw new NotFoundException('Source or target product not found');
            }

            if (source.stockActual < data.sourceQuantity) {
                throw new Error(`Insufficient stock for ${source.name}`);
            }

            // Update stocks
            await tx.product.update({
                where: { id: source.id },
                data: { stockActual: { decrement: data.sourceQuantity } },
            });

            await tx.product.update({
                where: { id: target.id },
                data: { stockActual: { increment: data.targetQuantity } },
            });

            // Log production
            return tx.productionLog.create({
                data: {
                    tenantId,
                    sourceProductId: source.id,
                    sourceQuantity: data.sourceQuantity,
                    targetProductId: target.id,
                    targetQuantity: data.targetQuantity,
                },
                include: {
                    sourceProduct: true,
                    targetProduct: true,
                },
            });
        });
    }
}

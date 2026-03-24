import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { RatesService } from '../rates/rates.service';
import { ProductsService } from '../products/products.service';
import { CustomersService } from '../customers/customers.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesService {
    constructor(
        private prisma: PrismaService,
        private tenantsService: TenantsService,
        private ratesService: RatesService,
        private productsService: ProductsService,
        private customersService: CustomersService,
    ) { }

    async create(data: {
        userId: string;
        customerId?: string;
        items: { productId: string; cantidad: number }[];
        paymentType: 'contado' | 'fiao';
        paymentMethod?: string;
        paymentReference?: string;
    }) {
        const tenantId = this.tenantsService.getTenantId();
        const rateData = await this.ratesService.getApplicableRate();
        if (!rateData) {
            throw new BadRequestException('Exchange rate not available');
        }
        const tasaMomento = Number(rateData.bcvRate);

        return this.prisma.$transaction(async (tx) => {
            let totalUsd = new Prisma.Decimal(0);
            const saleItemsData: Prisma.SaleItemCreateManySaleInputEnvelope['data'] = [];

            for (const item of data.items) {
                const product = await tx.product.findFirst({
                    where: { id: item.productId, tenantId },
                });

                if (!product) {
                    throw new NotFoundException(`Product ${item.productId} not found`);
                }

                if (product.stockActual < item.cantidad) {
                    throw new BadRequestException(`Insufficient stock for ${product.name}`);
                }

                const subtotal = product.priceBaseUsd.mul(item.cantidad);
                totalUsd = totalUsd.add(subtotal);

                saleItemsData.push({
                    productId: product.id,
                    cantidad: item.cantidad,
                    precioUnitarioUsd: product.priceBaseUsd,
                });

                // Decrement stock
                await tx.product.update({
                    where: { id: product.id },
                    data: { stockActual: { decrement: item.cantidad } },
                });
            }

            const totalVes = totalUsd.mul(tasaMomento);

            const sale = await tx.sale.create({
                data: {
                    tenantId,
                    userId: data.userId,
                    customerId: data.customerId,
                    totalUsd,
                    totalVes,
                    tasaMomento,
                    paymentType: data.paymentType,
                    paymentMethod: data.paymentMethod || (data.paymentType === 'fiao' ? 'credito' : 'efectivo'),
                    paymentReference: data.paymentReference,
                    items: {
                        create: saleItemsData,
                    },
                },
                include: {
                    items: true,
                },
            });

            if (data.paymentType === 'fiao' && data.customerId) {
                await tx.customer.update({
                    where: { id: data.customerId },
                    data: {
                        saldoPendienteUsd: { increment: totalUsd },
                    },
                });
                await tx.customerTransaction.create({
                    data: {
                        customerId: data.customerId,
                        tenantId,
                        type: 'DEBT',
                        amountUsd: totalUsd,
                        description: `Venta a crédito`,
                        paymentReference: data.paymentReference,
                    }
                });
            }

            return sale;
        });
    }

    async findAll() {
        const tenantId = this.tenantsService.getTenantId();
        return this.prisma.sale.findMany({
            where: { tenantId },
            include: { items: true, customer: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const tenantId = this.tenantsService.getTenantId();
        const sale = await this.prisma.sale.findFirst({
            where: { id, tenantId },
            include: { items: { include: { product: true } }, customer: true },
        });
        if (!sale) throw new NotFoundException('Sale not found');
        return sale;
    }

    async update(id: string, data: { paymentReference?: string; customerId?: string }) {
        const tenantId = this.tenantsService.getTenantId();
        const sale = await this.prisma.sale.findFirst({
            where: { id, tenantId },
        });

        if (!sale) throw new NotFoundException('Sale not found');

        return this.prisma.sale.update({
            where: { id },
            data: {
                paymentReference: data.paymentReference,
                customerId: data.customerId,
            },
        });
    }
}

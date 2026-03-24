import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class CustomersService {
    constructor(
        private prisma: PrismaService,
        private tenantsService: TenantsService,
    ) { }

    async create(data: { nombre: string; saldoPendienteUsd?: number; paymentReference?: string }) {
        const tenantId = this.tenantsService.getTenantId();
        const initialDebt = data.saldoPendienteUsd || 0;

        return this.prisma.customer.create({
            data: {
                nombre: data.nombre,
                saldoPendienteUsd: initialDebt,
                tenantId,
                transactions: initialDebt > 0 ? {
                    create: {
                        tenantId,
                        type: 'DEBT',
                        amountUsd: initialDebt,
                        description: 'Deuda inicial',
                        paymentReference: data.paymentReference,
                    }
                } : undefined
            },
        });
    }

    async findAll() {
        const tenantId = this.tenantsService.getTenantId();
        return this.prisma.customer.findMany({
            where: { tenantId },
        });
    }

    async findOne(id: string) {
        const tenantId = this.tenantsService.getTenantId();
        const customer = await this.prisma.customer.findFirst({
            where: { id, tenantId },
        });
        if (!customer) {
            throw new NotFoundException(`Customer with ID ${id} not found`);
        }
        return customer;
    }

    async update(id: string, data: { nombre?: string; saldoPendienteUsd?: number; paymentReference?: string }) {
        const customer = await this.findOne(id); // Ensure belonging to tenant

        if (data.saldoPendienteUsd !== undefined && data.saldoPendienteUsd !== Number(customer.saldoPendienteUsd)) {
            const oldSaldo = Number(customer.saldoPendienteUsd);
            const newSaldo = data.saldoPendienteUsd;

            if (newSaldo < oldSaldo) {
                // Payment
                const paidAmount = oldSaldo - newSaldo;
                await this.prisma.customerTransaction.create({
                    data: {
                        customerId: id,
                        tenantId: this.tenantsService.getTenantId(),
                        type: 'PAYMENT',
                        amountUsd: paidAmount,
                        description: 'Abono registrado',
                        paymentReference: data.paymentReference,
                    }
                });
            } else {
                // Increased debt manually?
                const increasedAmount = newSaldo - oldSaldo;
                await this.prisma.customerTransaction.create({
                    data: {
                        customerId: id,
                        tenantId: this.tenantsService.getTenantId(),
                        type: 'DEBT',
                        amountUsd: increasedAmount,
                        description: 'Ajuste manual de deuda',
                        paymentReference: data.paymentReference,
                    }
                });
            }
        }

        return this.prisma.customer.update({
            where: { id },
            data: {
                nombre: data.nombre,
                saldoPendienteUsd: data.saldoPendienteUsd,
            },
        });
    }

    async getHistory(id: string) {
        await this.findOne(id); // Ensure belonging to tenant
        return this.prisma.customerTransaction.findMany({
            where: { customerId: id },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateTransaction(txId: string, data: { paymentReference?: string }) {
        const tenantId = this.tenantsService.getTenantId();
        const tx = await this.prisma.customerTransaction.findFirst({
            where: { id: txId, tenantId },
        });

        if (!tx) throw new NotFoundException('Transaction not found');

        return this.prisma.customerTransaction.update({
            where: { id: txId },
            data: { paymentReference: data.paymentReference },
        });
    }

    async remove(id: string) {
        await this.findOne(id); // Ensure belonging to tenant

        return this.prisma.customer.delete({
            where: { id },
        });
    }
}

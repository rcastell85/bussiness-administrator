import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class SuppliesService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
  ) {}

  async findAll() {
    const tenantId = this.tenantsService.getTenantId();
    return this.prisma.supplyItem.findMany({
      where: { tenantId },
      include: {
        history: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { name: string; unit: string; initialStock?: number }) {
    const tenantId = this.tenantsService.getTenantId();
    return this.prisma.supplyItem.create({
      data: {
        name: data.name,
        unit: data.unit,
        stockActual: data.initialStock || 0,
        tenantId,
      },
    });
  }

  async recordHistory(data: { supplyItemId: string; type: 'ENTRY' | 'EXIT'; quantity: number; note?: string }) {
    const tenantId = this.tenantsService.getTenantId();
    return this.prisma.$transaction(async (tx) => {
      // Check ownership
      const item = await tx.supplyItem.findFirst({ where: { id: data.supplyItemId, tenantId } });
      if (!item) throw new Error('Item not found');

      // Create history record
      const history = await tx.supplyHistory.create({
        data: {
          supplyItemId: data.supplyItemId,
          type: data.type,
          quantity: data.quantity,
          note: data.note,
        },
      });

      // Update stock
      const adjustment = data.type === 'ENTRY' ? data.quantity : -data.quantity;
      await tx.supplyItem.update({
        where: { id: data.supplyItemId },
        data: {
          stockActual: {
            increment: adjustment,
          },
        },
      });

      return history;
    });
  }

  async delete(id: string) {
    const tenantId = this.tenantsService.getTenantId();
    // Check if it belongs to tenant
    const item = await this.prisma.supplyItem.findFirst({ where: { id, tenantId } });
    if (!item) throw new Error('Item not found');

    // Delete history first (due to FK)
    await this.prisma.supplyHistory.deleteMany({ where: { supplyItemId: id } });
    return this.prisma.supplyItem.delete({ where: { id } });
  }
}

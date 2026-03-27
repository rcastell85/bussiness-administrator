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
    try {
      const tenantId = this.tenantsService.getTenantId();
      return await this.prisma.supplyItem.findMany({
        where: { tenantId },
        include: {
          history: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching supplies:', error);
      throw error;
    }
  }

  async create(data: { name: string; unit: string; initialStock?: number }) {
    try {
      const tenantId = this.tenantsService.getTenantId();
      console.log('Creating supply for tenant:', tenantId, 'with data:', data);
      
      return await this.prisma.supplyItem.create({
        data: {
          name: data.name,
          unit: data.unit,
          stockActual: data.initialStock || 0,
          tenantId,
        },
      });
    } catch (error) {
      console.error('Error creating supply:', error);
      throw error;
    }
  }

  async recordHistory(data: { supplyItemId: string; type: 'ENTRY' | 'EXIT'; quantity: number; note?: string }) {
    try {
      const tenantId = this.tenantsService.getTenantId();
      return await this.prisma.$transaction(async (tx) => {
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
    } catch (error) {
      console.error('Error recording supply history:', error);
      throw error;
    }
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

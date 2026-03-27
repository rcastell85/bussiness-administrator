import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
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

  async create(tenantId: string, data: { name: string; unit: string; initialStock?: number }) {
    return this.prisma.supplyItem.create({
      data: {
        name: data.name,
        unit: data.unit,
        stockActual: data.initialStock || 0,
        tenantId,
      },
    });
  }

  async recordHistory(tenantId: string, data: { supplyItemId: string; type: 'ENTRY' | 'EXIT'; quantity: number; note?: string }) {
    return this.prisma.$transaction(async (tx) => {
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

  async delete(tenantId: string, id: string) {
    // Check if it belongs to tenant
    const item = await this.prisma.supplyItem.findFirst({ where: { id, tenantId } });
    if (!item) throw new Error('Item not found');

    // Delete history first (due to FK)
    await this.prisma.supplyHistory.deleteMany({ where: { supplyItemId: id } });
    return this.prisma.supplyItem.delete({ where: { id } });
  }
}

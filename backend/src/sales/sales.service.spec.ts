import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { RatesService } from '../rates/rates.service';
import { ProductsService } from '../products/products.service';
import { CustomersService } from '../customers/customers.service';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('SalesService', () => {
  let service: SalesService;
  let prisma: PrismaService;
  let tenants: TenantsService;
  let rates: RatesService;

  const mockPrisma = {
    $transaction: jest.fn((callback) => callback(mockPrisma)),
    product: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    sale: {
      create: jest.fn(),
    },
    customer: {
      update: jest.fn(),
    },
  };

  const mockTenants = { getTenantId: jest.fn().mockReturnValue('t1') };
  const mockRates = { getApplicableRate: jest.fn().mockResolvedValue({ bcvRate: 40 }) };
  const mockProducts = {};
  const mockCustomers = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TenantsService, useValue: mockTenants },
        { provide: RatesService, useValue: mockRates },
        { provide: ProductsService, useValue: mockProducts },
        { provide: CustomersService, useValue: mockCustomers },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    prisma = module.get<PrismaService>(PrismaService);
    tenants = module.get<TenantsService>(TenantsService);
    rates = module.get<RatesService>(RatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a sale and decrease stock', async () => {
      const product = {
        id: 'p1',
        name: 'Product 1',
        priceBaseUsd: new Prisma.Decimal(10),
        stockActual: 5
      };
      mockPrisma.product.findFirst.mockResolvedValue(product);
      mockPrisma.sale.create.mockResolvedValue({ id: 's1', totalUsd: 20 });

      const data = {
        userId: 'u1',
        items: [{ productId: 'p1', cantidad: 2 }],
        paymentType: 'contado' as const,
      };

      const result = await service.create(data);
      expect(result).toBeDefined();
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { stockActual: { decrement: 2 } },
      });
      expect(mockPrisma.sale.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          totalUsd: expect.any(Prisma.Decimal),
          totalVes: expect.any(Prisma.Decimal),
          tasaMomento: 40,
        }),
      }));
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      const product = {
        id: 'p1',
        name: 'Product 1',
        priceBaseUsd: new Prisma.Decimal(10),
        stockActual: 1
      };
      mockPrisma.product.findFirst.mockResolvedValue(product);

      const data = {
        userId: 'u1',
        items: [{ productId: 'p1', cantidad: 2 }],
        paymentType: 'contado' as const,
      };

      await expect(service.create(data)).rejects.toThrow(BadRequestException);
    });
  });
});

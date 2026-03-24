import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;
  let tenants: TenantsService;

  const mockPrisma = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockTenants = {
    getTenantId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TenantsService, useValue: mockTenants },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
    tenants = module.get<TenantsService>(TenantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product with tenantId', async () => {
      mockTenants.getTenantId.mockReturnValue('t1');
      const data = { name: 'Harina P.A.N.', priceBaseUsd: 1.2, stockActual: 100 };
      mockPrisma.product.create.mockResolvedValue({ id: 'p1', ...data, tenantId: 't1' });

      const result = await service.create(data);
      expect(result).toEqual({ id: 'p1', ...data, tenantId: 't1' });
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: { ...data, tenantId: 't1' },
      });
    });
  });

  describe('findAll', () => {
    it('should find all products for specific tenant', async () => {
      mockTenants.getTenantId.mockReturnValue('t1');
      mockPrisma.product.findMany.mockResolvedValue([{ id: 'p1', name: 'Product 1' }]);

      const result = await service.findAll();
      expect(result).toEqual([{ id: 'p1', name: 'Product 1' }]);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { tenantId: 't1' },
      });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if product missing for tenant', async () => {
      mockTenants.getTenantId.mockReturnValue('t1');
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne('p1')).rejects.toThrow(NotFoundException);
    });
  });
});

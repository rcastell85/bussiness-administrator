import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { NotFoundException } from '@nestjs/common';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: PrismaService;
  let tenants: TenantsService;

  const mockPrisma = {
    customer: {
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
        CustomersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TenantsService, useValue: mockTenants },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    prisma = module.get<PrismaService>(PrismaService);
    tenants = module.get<TenantsService>(TenantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a customer with tenantId', async () => {
      mockTenants.getTenantId.mockReturnValue('t1');
      const data = { nombre: 'Juan Perez', saldoPendienteUsd: 0 };
      mockPrisma.customer.create.mockResolvedValue({ id: 'c1', ...data, tenantId: 't1' });

      const result = await service.create(data);
      expect(result).toEqual({ id: 'c1', ...data, tenantId: 't1' });
      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: { ...data, tenantId: 't1' },
      });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if customer missing for tenant', async () => {
      mockTenants.getTenantId.mockReturnValue('t1');
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await expect(service.findOne('c1')).rejects.toThrow(NotFoundException);
    });

    it('should return customer if exists for tenant', async () => {
      mockTenants.getTenantId.mockReturnValue('t1');
      mockPrisma.customer.findFirst.mockResolvedValue({ id: 'c1', nombre: 'Juan' });

      const result = await service.findOne('c1');
      expect(result).toEqual({ id: 'c1', nombre: 'Juan' });
    });
  });
});

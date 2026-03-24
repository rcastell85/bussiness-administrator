import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('TenantsService', () => {
  let service: TenantsService;
  let prisma: PrismaService;

  const mockPrisma = {
    tenant: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a tenant', async () => {
      const data = { name: 'Test' };
      mockPrisma.tenant.create.mockResolvedValue({ id: '1', ...data });
      const result = await service.create(data);
      expect(result).toEqual({ id: '1', ...data });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if tenant missing', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });

    it('should return tenant', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: '1', name: 'Test' });
      const result = await service.findOne('1');
      expect(result).toEqual({ id: '1', name: 'Test' });
    });
  });
});

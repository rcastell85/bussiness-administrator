import { Test, TestingModule } from '@nestjs/testing';
import { RatesService } from './rates.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';

describe('RatesService', () => {
  let service: RatesService;
  let prisma: PrismaService;
  let tenants: TenantsService;

  const mockPrisma = {
    globalConfig: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    tenant: {
      update: jest.fn(),
    },
  };

  const mockTenants = {
    getTenantId: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TenantsService, useValue: mockTenants },
      ],
    }).compile();

    service = module.get<RatesService>(RatesService);
    prisma = module.get<PrismaService>(PrismaService);
    tenants = module.get<TenantsService>(TenantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize global rate if not exists', async () => {
      mockPrisma.globalConfig.findUnique.mockResolvedValue(null);
      await service.onModuleInit();
      expect(mockPrisma.globalConfig.create).toHaveBeenCalled();
    });
  });

  describe('getApplicableRate', () => {
    it('should return global rate if no tenantId is present', async () => {
      mockTenants.getTenantId.mockReturnValue(null);
      mockPrisma.globalConfig.findUnique.mockResolvedValue({ id: 'global', bcvRate: 36.5 });

      const result = await service.getApplicableRate();
      expect(result).toEqual({ id: 'global', bcvRate: 36.5 });
    });

    it('should return custom rate if tenant has one', async () => {
      mockTenants.getTenantId.mockReturnValue('tenant-1');
      mockTenants.findOne.mockResolvedValue({ id: 'tenant-1', configJson: { customRate: 40 } });

      const result = await service.getApplicableRate();
      expect(result).toEqual({ bcvRate: 40, isCustom: true });
    });
  });
});

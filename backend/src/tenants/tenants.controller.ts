import { Controller, Get, Post, Body, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Post()
    async create(@Body() createTenantDto: { name: string; rif?: string; configJson?: any }) {
        return this.tenantsService.create(createTenantDto);
    }

    @Get()
    async findAll() {
        return this.tenantsService.findAll();
    }

    @Get('config/global')
    async getGlobalConfig() {
        return this.tenantsService.getGlobalConfig();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.tenantsService.findOne(id);
    }
}

import { Controller, Get, Post, Body, Patch, UnauthorizedException } from '@nestjs/common';
import { RatesService } from './rates.service';

@Controller('rates')
export class RatesController {
    constructor(private readonly ratesService: RatesService) { }

    @Get('current')
    async getCurrentRate() {
        return this.ratesService.getApplicableRate();
    }

    @Get('global')
    async getGlobalRate() {
        return this.ratesService.getGlobalRate();
    }

    @Patch('global')
    async updateGlobal(@Body() data: { rate: number }) {
        // In a real app, we'd check if the user is a super-admin
        return this.ratesService.updateGlobalRate(data.rate);
    }

    @Patch('tenant')
    async updateTenant(@Body() data: { rate: number }) {
        return this.ratesService.updateTenantRate(data.rate);
    }
}

import { Controller, Get, Post, Body, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { SuppliesService } from './supplies.service';

@Controller('supplies')
export class SuppliesController {
  constructor(private readonly suppliesService: SuppliesService) {}

  @Get()
  async findAll(@Request() req) {
    return this.suppliesService.findAll(req.user.tenantId);
  }

  @Post()
  async create(@Request() req, @Body() data: { name: string; unit: string; initialStock?: number }) {
    return this.suppliesService.create(req.user.tenantId, data);
  }

  @Post('history')
  async recordHistory(@Request() req, @Body() data: { supplyItemId: string; type: 'ENTRY' | 'EXIT'; quantity: number; note?: string }) {
    return this.suppliesService.recordHistory(req.user.tenantId, data);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    return this.suppliesService.delete(req.user.tenantId, id);
  }
}

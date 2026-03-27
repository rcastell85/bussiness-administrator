import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { SuppliesService } from './supplies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('supplies')
@UseGuards(JwtAuthGuard)
export class SuppliesController {
  constructor(private readonly suppliesService: SuppliesService) {}

  @Get()
  async findAll() {
    return this.suppliesService.findAll();
  }

  @Post()
  async create(@Body() data: { name: string; unit: string; initialStock?: number }) {
    return this.suppliesService.create(data);
  }

  @Post('history')
  async recordHistory(@Body() data: { supplyItemId: string; type: 'ENTRY' | 'EXIT'; quantity: number; note?: string }) {
    return this.suppliesService.recordHistory(data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.suppliesService.delete(id);
  }
}

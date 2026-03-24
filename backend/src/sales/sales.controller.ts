import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Post()
    async create(@Request() req: any, @Body() data: {
        customerId?: string;
        items: { productId: string; cantidad: number }[];
        paymentType: 'contado' | 'fiao';
        paymentMethod?: string;
        paymentReference?: string;
    }) {
        return this.salesService.create({
            ...data,
            userId: req.user.userId,
        });
    }

    @Get()
    async findAll() {
        return this.salesService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.salesService.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: { paymentReference?: string; customerId?: string }) {
        return this.salesService.update(id, data);
    }
}

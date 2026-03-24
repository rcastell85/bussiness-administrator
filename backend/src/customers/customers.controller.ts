import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Post()
    async create(@Body() createCustomerDto: { nombre: string; saldoPendienteUsd?: number; paymentReference?: string }) {
        return this.customersService.create(createCustomerDto);
    }

    @Get()
    async findAll() {
        return this.customersService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.customersService.findOne(id);
    }

    @Get(':id/history')
    async getHistory(@Param('id') id: string) {
        return this.customersService.getHistory(id);
    }

    @Patch('transactions/:txId')
    async updateTransaction(@Param('txId') txId: string, @Body() data: { paymentReference?: string }) {
        return this.customersService.updateTransaction(txId, data);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateCustomerDto: { nombre?: string; saldoPendienteUsd?: number; paymentReference?: string }) {
        return this.customersService.update(id, updateCustomerDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.customersService.remove(id);
    }
}

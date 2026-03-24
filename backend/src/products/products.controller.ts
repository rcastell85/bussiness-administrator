import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    async create(@Body() createProductDto: { name: string; priceBaseUsd: number; stockActual: number; imageUrl?: string }) {
        return this.productsService.create(createProductDto);
    }

    @Get()
    async findAll(@Query('sortBy') sortBy?: string) {
        return this.productsService.findAll(sortBy);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateProductDto: { name?: string; priceBaseUsd?: number; stockActual?: number; imageUrl?: string }) {
        return this.productsService.update(id, updateProductDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.productsService.remove(id);
    }

    @Post('transform')
    async transform(@Body() data: {
        sourceProductId: string;
        sourceQuantity: number;
        targetProductId: string;
        targetQuantity: number;
    }) {
        return this.productsService.transform(data);
    }
}

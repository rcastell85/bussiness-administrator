import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ScraperService],
})
export class ScraperModule {}

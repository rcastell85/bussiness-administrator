import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as https from 'https';

@Injectable()
export class ScraperService implements OnModuleInit {
  private readonly logger = new Logger(ScraperService.name);

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.logger.log('Scraper service initialized, running initial scrape in 5 seconds...');
    setTimeout(() => {
      this.scrapeBCVRate();
    }, 5000);
  }

  @Cron(CronExpression.EVERY_2_HOURS)
  async handleCron() {
    this.logger.log('Cron triggered: Scraping BCV rate...');
    await this.scrapeBCVRate();
  }

  async scrapeBCVRate() {
    try {
      this.logger.log('Fetching BCV website...');
      const agent = new https.Agent({ rejectUnauthorized: false });
      const response = await axios.get('https://www.bcv.org.ve/', { httpsAgent: agent, timeout: 30000 });
      
      const $ = cheerio.load(response.data);
      const rateText = $('#dolar strong').text().trim().replace(',', '.');
      
      if (!rateText) {
        this.logger.warn('Could not extract rate from BCV HTML.');
        return;
      }
      
      const rate = parseFloat(rateText);
      if (isNaN(rate)) {
        this.logger.warn('Parsed rate is NaN');
        return;
      }

      this.logger.log(`Extracted Rate: ${rate}`);

      await this.prisma.globalConfig.upsert({
        where: { id: 'global' },
        update: { bcvRate: rate },
        create: { id: 'global', bcvRate: rate }
      });

      this.logger.log('GlobalConfig updated successfully with new BCV rate.');
      
    } catch (error: any) {
      this.logger.error(`Error scraping BCV: ${error.message}`);
    }
  }
}

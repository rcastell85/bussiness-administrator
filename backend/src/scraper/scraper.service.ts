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
    console.log('>>> [BCV SCRAPER] Service initialized, running initial scrape in 5 seconds...');
    setTimeout(() => {
      this.scrapeBCVRate();
    }, 5000);
  }

  @Cron('0 */2 * * * *') // Run every 2 minutes
  async handleCron() {
    console.log('>>> [BCV SCRAPER] Cron triggered: Scraping BCV rate...');
    await this.scrapeBCVRate();
  }

  async scrapeBCVRate() {
    try {
      console.log('>>> [BCV SCRAPER] Fetching BCV website...');
      const agent = new https.Agent({ rejectUnauthorized: false });
      const response = await axios.get('https://www.bcv.org.ve/', { httpsAgent: agent, timeout: 30000 });
      
      const $ = cheerio.load(response.data);
      const rateText = $('#dolar strong').text().trim().replace(',', '.');
      
      if (!rateText) {
        console.warn('>>> [BCV SCRAPER WARNING] Could not extract rate from BCV HTML.');
        return;
      }
      
      const rate = parseFloat(rateText);
      if (isNaN(rate)) {
        console.warn('>>> [BCV SCRAPER WARNING] Parsed rate is NaN');
        return;
      }

      console.log(`>>> [BCV SCRAPER] Extracted Rate: ${rate}`);

      await this.prisma.globalConfig.upsert({
        where: { id: 'global' },
        update: { bcvRate: rate },
        create: { id: 'global', bcvRate: rate }
      });

      console.log('>>> [BCV SCRAPER SUCCESS] GlobalConfig updated successfully with new BCV rate.');
      
    } catch (error: any) {
      console.error(`>>> [BCV SCRAPER ERROR] Error scraping BCV: ${error.message}`);
    }
  }
}

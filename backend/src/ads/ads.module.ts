import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Advertisement,
  AdImpression,
  AdClick,
  AdConversion,
} from '../database/entities';
import { AdsController, AdminAdsController } from './ads.controller';
import { AdsService } from './ads.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Advertisement,
      AdImpression,
      AdClick,
      AdConversion,
    ]),
  ],
  controllers: [AdsController, AdminAdsController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promotion } from '../database/entities';
import {
  PromotionsController,
  AdminPromotionsController,
} from './promotions.controller';
import { PromotionsService } from './promotions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Promotion])],
  controllers: [PromotionsController, AdminPromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}

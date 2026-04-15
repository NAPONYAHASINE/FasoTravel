import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  Booking,
  Trip,
  Payment,
  Operator,
  Station,
  Incident,
} from '../database/entities';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Booking,
      Trip,
      Payment,
      Operator,
      Station,
      Incident,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  UserOperatorRole,
  Route,
  TripSchedule,
  Trip,
  Ticket,
  PriceSegment,
  PriceHistory,
  CashTransaction,
} from '../database/entities';
import {
  ManagersController,
  CashiersController,
  RoutesController,
  ScheduleTemplatesController,
  PriceSegmentsController,
  PriceHistoryController,
  CashTransactionsController,
} from './societe.controller';
import { SocieteService } from './societe.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserOperatorRole,
      Route,
      TripSchedule,
      Trip,
      Ticket,
      PriceSegment,
      PriceHistory,
      CashTransaction,
    ]),
  ],
  controllers: [
    ManagersController,
    CashiersController,
    RoutesController,
    ScheduleTemplatesController,
    PriceSegmentsController,
    PriceHistoryController,
    CashTransactionsController,
  ],
  providers: [SocieteService],
  exports: [SocieteService],
})
export class SocieteModule {}

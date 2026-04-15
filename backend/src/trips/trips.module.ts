import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip, Segment, Seat, TripSchedule } from '../database/entities';
import {
  TripsController,
  AdminTripsController,
  RoutesPopularController,
} from './trips.controller';
import { TripsService } from './trips.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, Segment, Seat, TripSchedule])],
  controllers: [TripsController, AdminTripsController, RoutesPopularController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}

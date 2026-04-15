import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip, Station, Route, Ticket } from '../database/entities';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { TrackingGateway } from './tracking.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, Station, Route, Ticket])],
  controllers: [TrackingController],
  providers: [TrackingService, TrackingGateway],
  exports: [TrackingService],
})
export class TrackingModule {}

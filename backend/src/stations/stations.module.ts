import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Station, Trip, Ticket } from '../database/entities';
import {
  StationsController,
  AdminStationsController,
} from './stations.controller';
import { StationsService } from './stations.service';
import { HeartbeatModule } from '../heartbeat/heartbeat.module';

@Module({
  imports: [TypeOrmModule.forFeature([Station, Trip, Ticket]), HeartbeatModule],
  controllers: [StationsController, AdminStationsController],
  providers: [StationsService],
  exports: [StationsService],
})
export class StationsModule {}

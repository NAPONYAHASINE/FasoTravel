import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashierPresence } from '../database/entities';
import { HeartbeatController } from './heartbeat.controller';
import { HeartbeatService } from './heartbeat.service';

@Module({
  imports: [TypeOrmModule.forFeature([CashierPresence])],
  controllers: [HeartbeatController],
  providers: [HeartbeatService],
  exports: [HeartbeatService],
})
export class HeartbeatModule {}

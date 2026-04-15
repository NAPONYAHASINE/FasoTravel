import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Ticket,
  TicketTransfer,
  Booking,
  Seat,
  User,
} from '../database/entities';
import {
  TicketsController,
  AdminTicketsController,
} from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, TicketTransfer, Booking, Seat, User]),
  ],
  controllers: [TicketsController, AdminTicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}

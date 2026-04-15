import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Booking,
  Seat,
  Trip,
  BookingSegment,
  Segment,
} from '../database/entities';
import {
  BookingsController,
  AdminBookingsController,
} from './bookings.controller';
import { BookingsService } from './bookings.service';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Seat, Trip, BookingSegment, Segment]),
    forwardRef(() => TicketsModule),
  ],
  controllers: [BookingsController, AdminBookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}

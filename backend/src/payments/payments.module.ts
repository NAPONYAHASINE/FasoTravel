import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment, Booking } from '../database/entities';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Booking]), BookingsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

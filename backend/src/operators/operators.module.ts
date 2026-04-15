import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperatorsService } from './operators.service';
import {
  OperatorsController,
  AdminReviewsController,
  AdminOperatorServicesController,
} from './operators.controller';
import {
  Operator,
  OperatorStory,
  OperatorService,
  OperatorPolicy,
  Review,
  Booking,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Operator,
      OperatorStory,
      OperatorService,
      OperatorPolicy,
      Review,
      Booking,
    ]),
  ],
  controllers: [
    OperatorsController,
    AdminReviewsController,
    AdminOperatorServicesController,
  ],
  providers: [OperatorsService],
  exports: [OperatorsService],
})
export class OperatorsModule {}

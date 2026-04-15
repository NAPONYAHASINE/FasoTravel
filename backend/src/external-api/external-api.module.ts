import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ApiKey,
  Trip,
  Ticket,
  Station,
  Route,
  Booking,
  CashTransaction,
  Operator,
} from '../database/entities';
import {
  ExternalApiController,
  AdminExternalApiController,
} from './external-api.controller';
import { ExternalApiService } from './external-api.service';
import { ApiKeyGuard } from './api-key.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApiKey,
      Trip,
      Ticket,
      Station,
      Route,
      Booking,
      CashTransaction,
      Operator,
    ]),
  ],
  controllers: [ExternalApiController, AdminExternalApiController],
  providers: [ExternalApiService, ApiKeyGuard],
  exports: [ExternalApiService],
})
export class ExternalApiModule {}

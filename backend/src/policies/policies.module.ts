import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperatorPolicy, PlatformPolicy } from '../database/entities';
import { PoliciesService } from './policies.service';
import {
  OperatorPoliciesController,
  PlatformPoliciesController,
  AdminPoliciesController,
} from './policies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OperatorPolicy, PlatformPolicy])],
  controllers: [
    OperatorPoliciesController,
    PlatformPoliciesController,
    AdminPoliciesController,
  ],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralCoupon, User } from '../database/entities';
import { ReferralsController } from './referrals.controller';
import { UserReferralsController } from './user-referrals.controller';
import { ReferralsService } from './referrals.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReferralCoupon, User])],
  controllers: [ReferralsController, UserReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}

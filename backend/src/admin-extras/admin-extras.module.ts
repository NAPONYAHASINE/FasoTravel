import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoryCircle, FeatureFlag } from '../database/entities';
import { AdminExtrasService } from './admin-extras.service';
import {
  AdminStoryCirclesController,
  AdminFeatureFlagsController,
} from './admin-extras.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StoryCircle, FeatureFlag])],
  controllers: [AdminStoryCirclesController, AdminFeatureFlagsController],
  providers: [AdminExtrasService],
})
export class AdminExtrasModule {}

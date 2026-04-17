import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  OperatorStory,
  AdminStory,
  StoryView,
  StoryCircle,
  StoryCategory,
} from '../database/entities';
import {
  StoriesController,
  AdminStoriesController,
} from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OperatorStory,
      AdminStory,
      StoryView,
      StoryCircle,
      StoryCategory,
    ]),
  ],
  controllers: [StoriesController, AdminStoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
})
export class StoriesModule {}

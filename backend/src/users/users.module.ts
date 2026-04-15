import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Notification } from '../database/entities';
import {
  UsersController,
  UserProfileController,
  UsersMeController,
} from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Notification])],
  controllers: [UsersController, UserProfileController, UsersMeController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

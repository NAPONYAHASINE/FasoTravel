import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Notification,
  NotificationTemplate,
  AutomationRule,
  NotificationCampaign,
  ScheduledNotification,
  User,
  UserDevice,
} from '../database/entities';
import { NotificationsService } from './notifications.service';
import {
  AdminNotificationsController,
  MobileNotificationsController,
  FcmController,
} from './notifications.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationTemplate,
      AutomationRule,
      NotificationCampaign,
      ScheduledNotification,
      User,
      UserDevice,
    ]),
  ],
  controllers: [
    AdminNotificationsController,
    MobileNotificationsController,
    FcmController,
  ],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

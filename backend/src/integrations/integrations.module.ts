import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Integration,
  IntegrationAlertRule,
  IntegrationAlert,
} from '../database/entities';
import {
  IntegrationsController,
  PaydunyaAdminController,
  PaydunyaShortcutController,
  WhatsappAdminController,
  AwsAdminController,
  WhatsappShortcutController,
  AwsShortcutController,
  AlertsShortcutController,
} from './integrations.controller';
import { IntegrationsService } from './integrations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Integration,
      IntegrationAlertRule,
      IntegrationAlert,
    ]),
  ],
  controllers: [
    IntegrationsController,
    PaydunyaAdminController,
    PaydunyaShortcutController,
    WhatsappAdminController,
    AwsAdminController,
    WhatsappShortcutController,
    AwsShortcutController,
    AlertsShortcutController,
  ],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}

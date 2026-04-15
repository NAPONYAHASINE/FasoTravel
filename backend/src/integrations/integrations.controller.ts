import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';

// ═══════ INTEGRATIONS CRUD ═══════
@Controller('admin/integrations')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class IntegrationsController {
  constructor(private readonly service: IntegrationsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: Record<string, any>) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/test')
  testConnectivity(@Param('id') id: string) {
    return this.service.testConnectivity(id);
  }

  @Put(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.service.toggle(id);
  }

  // ── Alert Rules ──
  @Get(':id/alert-rules')
  getAlertRules(@Param('id') id: string) {
    return this.service.getAlertRules(id);
  }

  @Post(':id/alert-rules')
  createAlertRule(@Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.service.createAlertRule(id, dto);
  }

  @Put('alert-rules/:ruleId')
  updateAlertRule(
    @Param('ruleId') ruleId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.service.updateAlertRule(ruleId, dto);
  }

  @Delete('alert-rules/:ruleId')
  deleteAlertRule(@Param('ruleId') ruleId: string) {
    return this.service.deleteAlertRule(ruleId);
  }

  // ── Alerts ──
  @Get('alerts/all')
  getAlerts(@Query('integrationId') integrationId?: string) {
    return this.service.getAlerts(integrationId);
  }

  @Post('alerts/:id/acknowledge')
  acknowledgeAlert(
    @Param('id') id: string,
    @Req() req: { user?: { sub?: string } },
  ) {
    return this.service.acknowledgeAlert(id, req.user?.sub ?? '');
  }
}

// ═══════ PAYDUNYA ADMIN ═══════
@Controller('admin/integrations/paydunya')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class PaydunyaAdminController {
  constructor(private readonly service: IntegrationsService) {}

  @Get('config')
  getConfig() {
    return this.service.getPaydunyaConfig();
  }

  @Put('config')
  updateConfig(@Body() dto: Record<string, any>) {
    return this.service.updatePaydunyaConfig(dto);
  }

  @Get('health')
  getHealth() {
    return this.service.getPaydunyaHealth();
  }

  @Get('stats')
  getStats() {
    return this.service.getPaydunyaStats();
  }

  @Get('webhook-logs')
  getWebhookLogs() {
    return this.service.getPaydunyaWebhookLogs();
  }
}

// ═══════ WHATSAPP ADMIN ═══════
@Controller('admin/integrations/whatsapp')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class WhatsappAdminController {
  constructor(private readonly service: IntegrationsService) {}

  @Get('info')
  getInfo() {
    return this.service.getWhatsappInfo();
  }

  @Post('test-message')
  testMessage(@Body() dto: { phone: string; message: string }) {
    return this.service.sendWhatsappTestMessage(dto);
  }

  @Get('health')
  getHealth() {
    return this.service.getWhatsappHealth();
  }

  @Get('delivery-stats')
  getDeliveryStats() {
    return this.service.getWhatsappDeliveryStats();
  }
}

// ═══════ AWS ADMIN ═══════
@Controller('admin/integrations/aws')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AwsAdminController {
  constructor(private readonly service: IntegrationsService) {}

  @Get('health')
  getHealth() {
    return this.service.getAwsHealth();
  }

  @Get('s3/stats')
  getS3Stats() {
    return this.service.getS3Stats();
  }

  @Get('cdn/stats')
  getCdnStats() {
    return this.service.getCdnStats();
  }

  @Get('lightsail/metrics')
  getLightsailMetrics() {
    return this.service.getLightsailMetrics();
  }

  @Post('cdn/purge')
  purgeCdn() {
    return this.service.purgeCdn();
  }

  @Post('lightsail/restart')
  restartLightsail() {
    return this.service.restartLightsail();
  }
}

// ═══════ SHORTCUT: admin/whatsapp/* ═══════
@Controller('admin/whatsapp')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class WhatsappShortcutController {
  constructor(private readonly service: IntegrationsService) {}

  @Get('account')
  getAccount() {
    return this.service.getWhatsappInfo();
  }

  @Get('info')
  getInfo() {
    return this.service.getWhatsappInfo();
  }

  @Post('test-message')
  testMessage(@Body() dto: { phone: string; message: string }) {
    return this.service.sendWhatsappTestMessage(dto);
  }

  @Get('health')
  getHealth() {
    return this.service.getWhatsappHealth();
  }

  @Get('delivery-stats')
  getDeliveryStats() {
    return this.service.getWhatsappDeliveryStats();
  }
}

// ═══════ SHORTCUT: admin/aws/* ═══════
@Controller('admin/aws')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AwsShortcutController {
  constructor(private readonly service: IntegrationsService) {}

  @Get('health')
  getHealth() {
    return this.service.getAwsHealth();
  }

  @Get('s3/stats')
  getS3Stats() {
    return this.service.getS3Stats();
  }

  @Get('cloudfront/stats')
  getCloudfrontStats() {
    return this.service.getCdnStats();
  }

  @Get('cdn/stats')
  getCdnStats() {
    return this.service.getCdnStats();
  }

  @Get('lightsail/metrics')
  getLightsailMetrics() {
    return this.service.getLightsailMetrics();
  }

  @Post('cdn/purge')
  purgeCdn() {
    return this.service.purgeCdn();
  }

  @Post('cloudfront/purge')
  purgeCloudfrontAlias() {
    return this.service.purgeCdn();
  }

  @Post('lightsail/restart')
  restartLightsail() {
    return this.service.restartLightsail();
  }
}

// ═══════ SHORTCUT: admin/alerts/* ═══════
@Controller('admin/alerts')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AlertsShortcutController {
  constructor(private readonly service: IntegrationsService) {}

  @Get()
  getAlerts(@Query('integrationId') integrationId?: string) {
    return this.service.getAlerts(integrationId);
  }

  @Get('active-count')
  getActiveCount() {
    return this.service.getActiveAlertCount();
  }

  @Get('rules')
  getRules(@Query('integrationId') integrationId: string) {
    return this.service.getAlertRules(integrationId);
  }

  @Post('rules')
  createRule(@Body() dto: Record<string, any> & { integrationId: string }) {
    return this.service.createAlertRule(dto.integrationId, dto);
  }

  @Put('rules/:ruleId')
  updateRule(
    @Param('ruleId') ruleId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.service.updateAlertRule(ruleId, dto);
  }

  @Delete('rules/:ruleId')
  deleteRule(@Param('ruleId') ruleId: string) {
    return this.service.deleteAlertRule(ruleId);
  }

  @Post(':id/acknowledge')
  acknowledgeAlert(
    @Param('id') id: string,
    @Req() req: { user?: { sub?: string } },
  ) {
    return this.service.acknowledgeAlert(id, req.user?.sub ?? '');
  }
}

// ═══════ SHORTCUT: admin/paydunya/* ═══════
@Controller('admin/paydunya')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class PaydunyaShortcutController {
  constructor(private readonly service: IntegrationsService) {}

  @Get()
  getConfig() {
    return this.service.getPaydunyaConfig();
  }

  @Put('credentials')
  updateCredentials(@Body() dto: Record<string, any>) {
    return this.service.updatePaydunyaConfig(dto);
  }

  @Put('mode')
  switchMode(@Body('mode') mode: string) {
    return this.service.switchPaydunyaMode(mode);
  }

  @Put('channels/:key/toggle')
  toggleChannel(@Param('key') key: string) {
    return this.service.togglePaydunyaChannel(key);
  }

  @Put('channels/:key/fee')
  updateChannelFee(@Param('key') key: string, @Body('fee') fee: number) {
    return this.service.updatePaydunyaChannelFee(key, fee);
  }

  @Get('health')
  getHealth() {
    return this.service.getPaydunyaHealth();
  }

  @Post('test')
  testConnection() {
    return this.service.testPaydunyaConnection();
  }

  @Get('stats/channels')
  getChannelStats() {
    return this.service.getPaydunyaStats();
  }

  @Get('webhook-logs')
  getWebhookLogs() {
    return this.service.getPaydunyaWebhookLogs();
  }
}

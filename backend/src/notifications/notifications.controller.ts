import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  SendBulkDto,
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateNotificationDto,
} from './dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';

// ========== ADMIN CONTROLLER ==========
@Controller('admin/notifications')
@Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
export class AdminNotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  getAll() {
    return this.service.getAdminNotifications();
  }

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.service.createNotification(dto);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.service.markAsRead(id);
  }

  @Post('send-bulk')
  sendBulk(@Body() dto: SendBulkDto) {
    return this.service.sendBulk(dto);
  }

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('stats/channels')
  getChannelStats() {
    return this.service.getChannelStats();
  }

  @Get('stats/weekly')
  getWeeklyStats() {
    return this.service.getWeeklyStats();
  }

  @Get('audiences')
  getAudienceSegments() {
    return this.service.getAudienceSegments();
  }

  // Automation Rules
  @Get('automations')
  getAutomationRules() {
    return this.service.getAutomationRules();
  }

  @Post('automations')
  createAutomationRule(@Body() dto: CreateAutomationRuleDto) {
    return this.service.createAutomationRule(dto);
  }

  @Put('automations/:id')
  updateAutomationRule(
    @Param('id') id: string,
    @Body() dto: UpdateAutomationRuleDto,
  ) {
    return this.service.updateAutomationRule(id, dto);
  }

  @Delete('automations/:id')
  deleteAutomationRule(@Param('id') id: string) {
    return this.service.deleteAutomationRule(id);
  }

  // Sent History
  @Get('history')
  getSentHistory() {
    return this.service.getSentHistory();
  }

  // Templates
  @Get('templates')
  getTemplates() {
    return this.service.getTemplates();
  }

  @Post('templates')
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.service.createTemplate(dto);
  }

  @Put('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.service.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string) {
    return this.service.deleteTemplate(id);
  }

  @Put('templates/:id/use')
  useTemplate(@Param('id') id: string) {
    return this.service.useTemplate(id);
  }

  // Scheduled
  @Get('scheduled')
  getScheduled() {
    return this.service.getScheduled();
  }

  @Put('scheduled/:id/cancel')
  cancelScheduled(@Param('id') id: string) {
    return this.service.cancelScheduled(id);
  }
}

// ========== MOBILE CONTROLLER ==========
@Controller('notifications')
export class MobileNotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  getAll(@Req() req: { user?: { sub?: string } }) {
    return this.service.getUserNotifications(req.user?.sub ?? '');
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: { user?: { sub?: string } }) {
    return this.service.markUserNotificationAsRead(req.user?.sub ?? '', id);
  }

  @Put('read-all')
  markAllAsRead(@Req() req: { user?: { sub?: string } }) {
    return this.service.markAllUserNotificationsAsRead(req.user?.sub ?? '');
  }

  @Get('unread/count')
  getUnreadCount(@Req() req: { user?: { sub?: string } }) {
    return this.service.getUnreadCount(req.user?.sub ?? '');
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: { user?: { sub?: string } }) {
    return this.service.deleteUserNotification(req.user?.sub ?? '', id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user?: { sub?: string } }) {
    return this.service.getUserNotificationById(req.user?.sub ?? '', id);
  }

  @Post()
  registerToken(
    @Body() body: { token: string; deviceType?: string },
    @Req() req: { user?: { sub?: string } },
  ) {
    return this.service.registerFcmToken(
      req.user?.sub ?? '',
      body.token,
      body.deviceType,
    );
  }
}

// ========== FCM TOKEN ENDPOINT ==========
@Controller('api/mobile/fcm')
export class FcmController {
  constructor(private readonly service: NotificationsService) {}

  @Post('token')
  registerToken(
    @Body() body: { token: string; deviceType?: string },
    @Req() req: { user?: { sub?: string } },
  ) {
    return this.service.registerFcmToken(
      req.user?.sub ?? '',
      body.token,
      body.deviceType,
    );
  }
}

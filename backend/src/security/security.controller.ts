import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SecurityService } from './security.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/constants';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  ChangePasswordDto,
  Verify2FADto,
  BlockIpDto,
  SessionQueryDto,
} from './dto';

/* ═══════════ Admin Security ═══════════ */

@Controller('admin/security')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
export class AdminSecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('profile')
  getProfile(@CurrentUser('userId') userId: string) {
    return this.securityService.getSecurityProfile(userId);
  }

  @Post('change-password')
  changePassword(
    @CurrentUser('userId') userId: string,
    @Body() dto: ChangePasswordDto,
    @Req() req: { ip?: string },
  ) {
    return this.securityService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
      req.ip,
    );
  }

  @Post('2fa/enable')
  enable2FA(
    @CurrentUser('userId') userId: string,
    @Req() req: { ip?: string },
  ) {
    return this.securityService.initiate2FA(userId, req.ip);
  }

  @Post('2fa/verify')
  verify2FA(
    @CurrentUser('userId') userId: string,
    @Body() dto: Verify2FADto,
    @Req() req: { ip?: string },
  ) {
    return this.securityService.verify2FA(userId, dto.code, req.ip);
  }

  @Post('2fa/disable')
  disable2FA(
    @CurrentUser('userId') userId: string,
    @Req() req: { ip?: string },
  ) {
    return this.securityService.disable2FA(userId, req.ip);
  }

  @Get('sessions')
  getActiveSessions(@CurrentUser('userId') userId: string) {
    return this.securityService.getActiveSessions(userId);
  }

  @Delete('sessions/:id/revoke')
  revokeSession(
    @CurrentUser('userId') userId: string,
    @Param('id') sessionId: string,
    @Req() req: { ip?: string },
  ) {
    return this.securityService.revokeSession(userId, sessionId, req.ip);
  }

  @Delete('sessions/revoke-others')
  revokeOtherSessions(
    @CurrentUser('userId') userId: string,
    @Req() req: { ip?: string },
  ) {
    return this.securityService.revokeAllOtherSessions(
      userId,
      undefined,
      req.ip,
    );
  }

  @Get('events')
  getEvents(
    @CurrentUser('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.securityService.getSecurityEvents(
      userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }
}

/* ═══════════ Platform Session Management ═══════════ */

@Controller('sessions')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SessionsController {
  constructor(private readonly securityService: SecurityService) {}

  @Get()
  findAll(@Query() query: SessionQueryDto) {
    return this.securityService.getAllSessions({
      page: query.page,
      limit: query.limit,
      deviceType: query.deviceType,
      userType: query.userType,
      active: query.active,
      search: query.search,
    });
  }

  @Get('stats')
  getStats() {
    return this.securityService.getSessionStats();
  }

  @Get('blocked-ips')
  getBlockedIps() {
    return this.securityService.getBlockedIps();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.securityService.getSessionById(id);
  }

  @Delete(':id/terminate')
  terminate(@Param('id') id: string) {
    return this.securityService.terminateSession(id);
  }

  @Post('terminate-bulk')
  terminateBulk(@Body('sessionIds') sessionIds: string[]) {
    return this.securityService.terminateBulk(sessionIds);
  }

  @Delete('user/:userId/terminate')
  terminateByUser(@Param('userId') userId: string) {
    return this.securityService.terminateByUser(userId);
  }

  @Post('terminate-suspicious')
  terminateSuspicious() {
    return this.securityService.terminateAllSuspicious();
  }

  @Post('block-ip')
  blockIp(@Body() dto: BlockIpDto, @CurrentUser('userId') userId: string) {
    return this.securityService.blockIp(dto.ip, dto.reason, userId);
  }

  @Delete('blocked-ips/:ip')
  unblockIp(@Param('ip') ip: string) {
    return this.securityService.unblockIp(ip);
  }

  @Get('export')
  exportSessions(@Query() query: SessionQueryDto) {
    return this.securityService.exportSessions({
      page: query.page,
      limit: query.limit,
      deviceType: query.deviceType,
      userType: query.userType,
      active: query.active,
      search: query.search,
    });
  }
}

/* ═══════════ Admin Sessions Alias ═══════════ */

@Controller('admin/sessions')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminSessionsController {
  constructor(private readonly securityService: SecurityService) {}

  @Get()
  findAll(@Query() query: SessionQueryDto) {
    return this.securityService.getAllSessions({
      page: query.page,
      limit: query.limit,
      deviceType: query.deviceType,
      userType: query.userType,
      active: query.active,
      search: query.search,
    });
  }

  @Get('stats')
  getStats() {
    return this.securityService.getSessionStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.securityService.getSessionById(id);
  }

  @Delete(':id/terminate')
  terminate(@Param('id') id: string) {
    return this.securityService.terminateSession(id);
  }
}

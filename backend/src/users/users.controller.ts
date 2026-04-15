import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  UpdatePassengerDto,
  PassengerQueryDto,
  SendNotificationDto,
} from './dto';

@Controller('admin/passengers')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() query: PassengerQueryDto) {
    return this.usersService.findPassengers(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findPassengerById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePassengerDto,
  ) {
    return this.usersService.updatePassenger(id, dto);
  }

  @Post(':id/suspend')
  suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.usersService.suspendPassenger(id, reason ?? 'Admin action');
  }

  @Post(':id/reactivate')
  reactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.reactivatePassenger(id);
  }

  @Post(':id/verify')
  verify(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.verifyPassenger(id);
  }

  @Post(':id/reset-password')
  resetPassword(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.resetPassengerPassword(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deletePassenger(id);
  }

  @Post(':id/notify')
  notify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendNotificationDto,
  ) {
    return this.usersService.sendNotification(id, dto);
  }
}

// ========== MOBILE USER PROFILE ==========
@Controller('user')
export class UserProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Req() req: { user?: { sub?: string } }) {
    return this.usersService.getUserProfile(req.user?.sub ?? '');
  }

  @Put('profile')
  updateProfile(
    @Req() req: { user?: { sub?: string } },
    @Body() dto: UpdatePassengerDto,
  ) {
    return this.usersService.updateUserProfile(req.user?.sub ?? '', dto);
  }

  @Get('export')
  exportData(@Req() req: { user?: { sub?: string } }) {
    return this.usersService.exportUserData(req.user?.sub ?? '');
  }

  @Delete('delete')
  deleteAccount(@Req() req: { user?: { sub?: string } }) {
    return this.usersService.deleteUserAccount(req.user?.sub ?? '');
  }
}

// ========== MOBILE /users/me ALIASES ==========
@Controller('users')
export class UsersMeController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Req() req: { user?: { sub?: string } }) {
    return this.usersService.getUserProfile(req.user?.sub ?? '');
  }

  @Patch('me')
  updateProfile(
    @Req() req: { user?: { sub?: string } },
    @Body() dto: UpdatePassengerDto,
  ) {
    return this.usersService.updateUserProfile(req.user?.sub ?? '', dto);
  }

  @Get('me/export')
  exportData(@Req() req: { user?: { sub?: string } }) {
    return this.usersService.exportUserData(req.user?.sub ?? '');
  }
}

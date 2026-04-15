import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create booking (hold seats for 10 min)' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(userId, dto);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm booking (after payment)' })
  confirm(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.bookingsService.confirm(id, userId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel booking and release seats' })
  cancel(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.bookingsService.cancel(id, userId);
  }

  @Delete(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel booking (DELETE alias)' })
  cancelDelete(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.bookingsService.cancel(id, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get my bookings (alias for /bookings/my)' })
  findBookings(
    @CurrentUser('sub') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.bookingsService.findMyBookings(userId, pagination);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my bookings' })
  findMyBookings(
    @CurrentUser('sub') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.bookingsService.findMyBookings(userId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking detail' })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.bookingsService.findOne(id, userId);
  }
}

// ========== ADMIN BOOKINGS ==========
@ApiTags('Admin Bookings')
@Controller('admin/bookings')
export class AdminBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  findAll(@Query() pagination: PaginationDto) {
    return this.bookingsService.findAllAdmin(pagination);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  getStats() {
    return this.bookingsService.getAdminStats();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOneAdmin(id);
  }
}

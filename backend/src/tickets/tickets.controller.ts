import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import {
  TransferTicketDto,
  CreateSocieteTicketDto,
  UpdateTicketDto,
} from './dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my tickets (alias for /tickets/my)' })
  findTickets(
    @CurrentUser('sub') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.ticketsService.findMyTickets(userId, pagination);
  }

  @Get('my')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my tickets' })
  findMyTickets(
    @CurrentUser('sub') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.ticketsService.findMyTickets(userId, pagination);
  }

  @Public()
  @Get('verify/:code')
  @ApiOperation({ summary: 'Verify ticket by alphanumeric code' })
  verifyByCode(@Param('code') code: string) {
    return this.ticketsService.verifyByCode(code);
  }

  @Public()
  @Get(':id/validate')
  @ApiOperation({ summary: 'Validate ticket by ID (alias)' })
  validateById(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ticket detail' })
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Get(':id/download')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download ticket (QR + details)' })
  download(@Param('id') id: string) {
    return this.ticketsService.downloadTicket(id);
  }

  @Post()
  @Roles(
    UserRole.RESPONSABLE,
    UserRole.MANAGER,
    UserRole.CAISSIER,
    UserRole.OPERATOR_ADMIN,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create ticket (counter sale)' })
  create(@Body() dto: CreateSocieteTicketDto) {
    return this.ticketsService.createSocieteTicket(dto);
  }

  @Put(':id')
  @Roles(
    UserRole.RESPONSABLE,
    UserRole.MANAGER,
    UserRole.CAISSIER,
    UserRole.OPERATOR_ADMIN,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ticket details' })
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.updateTicket(id, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a ticket' })
  cancel(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.ticketsService.cancelTicket(id, userId);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund a cancelled ticket' })
  refund(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.ticketsService.refundTicket(id, userId);
  }

  @Post(':id/transfer')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transfer ticket to another user' })
  transfer(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: TransferTicketDto,
  ) {
    return this.ticketsService.transfer(id, userId, dto);
  }
}

@ApiTags('Admin Tickets')
@ApiBearerAuth()
@Controller('admin/tickets')
@Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
export class AdminTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'List all tickets (admin)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.ticketsService.findAllAdmin(pagination);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Ticket statistics (admin)' })
  getStats() {
    return this.ticketsService.getAdminStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket detail (admin)' })
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOneAdmin(id);
  }
}

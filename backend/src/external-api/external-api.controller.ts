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
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { ExternalApiService } from './external-api.service';
import { ApiKeyGuard } from './api-key.guard';
import {
  ExternalCreateTripDto,
  ExternalUpdateTripStatusDto,
  ExternalCreateTicketDto,
  ExternalLocationDto,
  ExternalCashTransactionDto,
  ExternalQueryDto,
  CreateApiKeyDto,
} from './dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';

/**
 * External API for societes connecting their own systems.
 * Auth: X-Api-Key header (API key per company).
 * All endpoints scoped to the operator owning the API key.
 */
@ApiTags('External API')
@ApiSecurity('api-key')
@Public() // Bypass JWT — uses API key guard instead
@UseGuards(ApiKeyGuard)
@Controller('api/external')
export class ExternalApiController {
  constructor(private readonly service: ExternalApiService) {}

  // ─── INJECTION: Push data into FasoTravel ─────────────────

  @Post('trips')
  @ApiOperation({ summary: 'Inject a trip/departure' })
  createTrip(
    @Req() req: { operatorId: string },
    @Body() dto: ExternalCreateTripDto,
  ) {
    return this.service.injectTrip(req.operatorId, dto);
  }

  @Put('trips/:id/status')
  @ApiOperation({ summary: 'Update trip status' })
  updateTripStatus(
    @Req() req: { operatorId: string },
    @Param('id') id: string,
    @Body() dto: ExternalUpdateTripStatusDto,
  ) {
    return this.service.updateTripStatus(req.operatorId, id, dto);
  }

  @Post('trips/:id/location')
  @ApiOperation({ summary: 'Push GPS location for a trip' })
  pushLocation(
    @Req() req: { operatorId: string },
    @Param('id') id: string,
    @Body() dto: ExternalLocationDto,
  ) {
    return this.service.pushLocation(req.operatorId, id, dto);
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Inject a ticket sale' })
  createTicket(
    @Req() req: { operatorId: string },
    @Body() dto: ExternalCreateTicketDto,
  ) {
    return this.service.injectTicket(req.operatorId, dto);
  }

  @Post('cash-transactions')
  @ApiOperation({ summary: 'Inject a cash transaction' })
  createCashTransaction(
    @Req() req: { operatorId: string },
    @Body() dto: ExternalCashTransactionDto,
  ) {
    return this.service.injectCashTransaction(req.operatorId, dto);
  }

  // ─── EXTRACTION: Read data from FasoTravel ────────────────

  @Get('trips')
  @ApiOperation({ summary: 'List company trips' })
  getTrips(
    @Req() req: { operatorId: string },
    @Query() query: ExternalQueryDto,
  ) {
    return this.service.getTrips(req.operatorId, query);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List tickets sold' })
  getTickets(
    @Req() req: { operatorId: string },
    @Query() query: ExternalQueryDto,
  ) {
    return this.service.getTickets(req.operatorId, query);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Get online bookings' })
  getBookings(
    @Req() req: { operatorId: string },
    @Query() query: ExternalQueryDto,
  ) {
    return this.service.getBookings(req.operatorId, query);
  }

  @Get('stations')
  @ApiOperation({ summary: 'List company stations' })
  getStations(@Req() req: { operatorId: string }) {
    return this.service.getStations(req.operatorId);
  }

  @Get('routes')
  @ApiOperation({ summary: 'List company routes' })
  getRoutes(@Req() req: { operatorId: string }) {
    return this.service.getRoutes(req.operatorId);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Revenue & passenger statistics' })
  getAnalytics(
    @Req() req: { operatorId: string },
    @Query() query: ExternalQueryDto,
  ) {
    return this.service.getAnalytics(req.operatorId, query);
  }

  @Get('cash-transactions')
  @ApiOperation({ summary: 'List cash transactions' })
  getCashTransactions(
    @Req() req: { operatorId: string },
    @Query() query: ExternalQueryDto,
  ) {
    return this.service.getCashTransactions(req.operatorId, query);
  }
}

/**
 * Admin controller for managing external API keys.
 * Uses standard JWT auth with SUPER_ADMIN role.
 */
@ApiTags('Admin External API')
@Controller('admin/external-api')
@Roles(UserRole.SUPER_ADMIN)
export class AdminExternalApiController {
  constructor(private readonly service: ExternalApiService) {}

  @Post('operators/:operatorId/keys')
  @ApiOperation({ summary: 'Create API key for an operator' })
  createKey(
    @Param('operatorId') operatorId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.service.createApiKey(operatorId, dto);
  }

  @Get('operators/:operatorId/keys')
  @ApiOperation({ summary: 'List API keys for an operator' })
  listKeys(@Param('operatorId') operatorId: string) {
    return this.service.listApiKeys(operatorId);
  }

  @Delete('operators/:operatorId/keys/:keyId')
  @ApiOperation({ summary: 'Revoke an API key' })
  revokeKey(
    @Param('operatorId') operatorId: string,
    @Param('keyId') keyId: string,
  ) {
    return this.service.revokeApiKey(operatorId, keyId);
  }
}

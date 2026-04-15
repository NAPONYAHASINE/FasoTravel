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
import { SocieteService } from './societe.service';
import {
  CreateStaffDto,
  UpdateStaffDto,
  CreateRouteDto,
  UpdateRouteDto,
  CreateScheduleTemplateDto,
  UpdateScheduleTemplateDto,
  CashTransactionQueryDto,
  CreateCashTransactionDto,
} from './dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';

interface JwtRequest {
  user?: { operatorId?: string; sub?: string };
}

// Helper to extract operatorId from JWT (stored in req.user)
function getOperatorId(req: JwtRequest): string {
  return req.user?.operatorId ?? req.user?.sub ?? '';
}
function getUserId(req: JwtRequest): string {
  return req.user?.sub ?? '';
}

// ══════════ MANAGERS ══════════
@Controller('managers')
@UseGuards(RolesGuard)
@Roles(UserRole.RESPONSABLE, UserRole.OPERATOR_ADMIN)
export class ManagersController {
  constructor(private readonly service: SocieteService) {}

  @Get()
  findAll(@Req() req: JwtRequest) {
    return this.service.getManagers(getOperatorId(req));
  }

  @Get(':id')
  findOne(@Req() req: JwtRequest, @Param('id') id: string) {
    return this.service.getManagerById(getOperatorId(req), id);
  }

  @Post()
  create(@Req() req: JwtRequest, @Body() dto: CreateStaffDto) {
    return this.service.createManager(getOperatorId(req), dto);
  }

  @Put(':id')
  update(
    @Req() req: JwtRequest,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.service.updateManager(getOperatorId(req), id, dto);
  }

  @Delete(':id')
  remove(@Req() req: JwtRequest, @Param('id') id: string) {
    return this.service.deleteManager(getOperatorId(req), id);
  }
}

// ══════════ CASHIERS ══════════
@Controller('cashiers')
@UseGuards(RolesGuard)
@Roles(UserRole.RESPONSABLE, UserRole.MANAGER, UserRole.OPERATOR_ADMIN)
export class CashiersController {
  constructor(private readonly service: SocieteService) {}

  @Get()
  findAll(@Req() req: JwtRequest) {
    return this.service.getCashiers(getOperatorId(req));
  }

  @Get(':id')
  findOne(@Req() req: JwtRequest, @Param('id') id: string) {
    return this.service.getCashierById(getOperatorId(req), id);
  }

  @Post()
  create(@Req() req: JwtRequest, @Body() dto: CreateStaffDto) {
    return this.service.createCashier(getOperatorId(req), dto);
  }

  @Put(':id')
  update(
    @Req() req: JwtRequest,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.service.updateCashier(getOperatorId(req), id, dto);
  }

  @Delete(':id')
  remove(@Req() req: JwtRequest, @Param('id') id: string) {
    return this.service.deleteCashier(getOperatorId(req), id);
  }
}

// ══════════ ROUTES ══════════
@Controller('routes')
@UseGuards(RolesGuard)
@Roles(UserRole.RESPONSABLE, UserRole.OPERATOR_ADMIN)
export class RoutesController {
  constructor(private readonly service: SocieteService) {}

  @Get()
  findAll(@Req() req: JwtRequest) {
    return this.service.getRoutes(getOperatorId(req));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.getRouteById(id);
  }

  @Post()
  create(@Body() dto: CreateRouteDto) {
    return this.service.createRoute(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRouteDto) {
    return this.service.updateRoute(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.deleteRoute(id);
  }
}

// ══════════ SCHEDULE TEMPLATES ══════════
@Controller('schedule-templates')
@UseGuards(RolesGuard)
@Roles(UserRole.RESPONSABLE, UserRole.OPERATOR_ADMIN)
export class ScheduleTemplatesController {
  constructor(private readonly service: SocieteService) {}

  @Get()
  findAll(@Req() req: JwtRequest) {
    return this.service.getScheduleTemplates(getOperatorId(req));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.getScheduleTemplateById(id);
  }

  @Post()
  create(@Req() req: JwtRequest, @Body() dto: CreateScheduleTemplateDto) {
    return this.service.createScheduleTemplate(getOperatorId(req), dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateScheduleTemplateDto) {
    return this.service.updateScheduleTemplate(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.deleteScheduleTemplate(id);
  }
}

// ══════════ PRICE SEGMENTS ══════════
@Controller('price-segments')
@UseGuards(RolesGuard)
@Roles(UserRole.RESPONSABLE, UserRole.OPERATOR_ADMIN)
export class PriceSegmentsController {
  constructor(private readonly service: SocieteService) {}

  @Get()
  findAll(@Req() req: JwtRequest) {
    return this.service.getPriceSegments(getOperatorId(req));
  }

  @Put(':id')
  update(
    @Req() req: JwtRequest,
    @Param('id') id: string,
    @Body() body: { price: number },
  ) {
    return this.service.updatePriceSegment(id, body.price, getUserId(req));
  }
}

// ══════════ PRICE HISTORY ══════════
@Controller('price-history')
export class PriceHistoryController {
  constructor(private readonly service: SocieteService) {}

  @Get()
  findAll(@Query('segmentId') segmentId: string) {
    return this.service.getPriceHistory(segmentId);
  }
}

// ══════════ CASH TRANSACTIONS ══════════
@Controller('cash-transactions')
@UseGuards(RolesGuard)
@Roles(UserRole.RESPONSABLE, UserRole.MANAGER, UserRole.CAISSIER)
export class CashTransactionsController {
  constructor(private readonly service: SocieteService) {}

  @Get()
  findAll(@Req() req: JwtRequest, @Query() query: CashTransactionQueryDto) {
    return this.service.getCashTransactions(getOperatorId(req), query);
  }

  @Post()
  create(@Req() req: JwtRequest, @Body() dto: CreateCashTransactionDto) {
    return this.service.createCashTransaction(
      getOperatorId(req),
      getUserId(req),
      dto,
    );
  }
}

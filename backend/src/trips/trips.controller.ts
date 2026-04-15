import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { SearchTripsDto, CreateTripDto, UpdateTripDto } from './dto';
import { TripFilterQuery } from './dto/trip-filter-query.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';

@ApiTags('Trips')
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List trips with optional filters' })
  findAll(@Query() query: TripFilterQuery) {
    return this.tripsService.findAll(query);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search trips (from, to, date, passengers)' })
  search(@Query() dto: SearchTripsDto) {
    return this.tripsService.search(dto);
  }

  @Public()
  @Get('popular')
  @ApiOperation({ summary: 'Get popular trips' })
  findPopular(@Query() pagination: PaginationDto) {
    return this.tripsService.findPopular(pagination);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get trip detail with segments' })
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(id);
  }

  @Public()
  @Get(':id/seats')
  @ApiOperation({ summary: 'Get seat map for a trip' })
  getSeats(@Param('id') id: string) {
    return this.tripsService.getSeats(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN, UserRole.RESPONSABLE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create trip (admin/responsable)' })
  create(@Body() dto: CreateTripDto) {
    return this.tripsService.create(dto);
  }

  @Post('generate-from-templates')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN, UserRole.RESPONSABLE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Auto-generate trips from schedule templates' })
  generateFromTemplates(@Body() body: { operatorId: string; date: string }) {
    return this.tripsService.generateFromTemplates(body.operatorId, body.date);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN, UserRole.RESPONSABLE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update trip (admin/responsable)' })
  update(@Param('id') id: string, @Body() dto: UpdateTripDto) {
    return this.tripsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete trip (admin)' })
  remove(@Param('id') id: string) {
    return this.tripsService.remove(id);
  }
}

@ApiTags('Admin Trips')
@ApiBearerAuth()
@Controller('admin/trips')
@Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
export class AdminTripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'List all trips (admin)' })
  getSummary(@Query() pagination: PaginationDto) {
    return this.tripsService.getAdminSummary(pagination);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Trip statistics (admin)' })
  getStats() {
    return this.tripsService.getAdminStats();
  }

  @Get('summary/:companyId')
  @ApiOperation({ summary: 'Trips by company (admin)' })
  getSummaryByCompany(@Param('companyId') companyId: string) {
    return this.tripsService.getAdminSummaryByCompany(companyId);
  }
}

// ========== PUBLIC ROUTES/POPULAR ==========
@ApiTags('Routes')
@Controller('routes')
export class RoutesPopularController {
  constructor(private readonly tripsService: TripsService) {}

  @Public()
  @Get('popular')
  @ApiOperation({ summary: 'Get popular routes based on trip frequency' })
  findPopularRoutes() {
    return this.tripsService.findPopularRoutes();
  }
}

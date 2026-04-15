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
import { StationsService } from './stations.service';
import {
  CreateStationDto,
  UpdateStationDto,
  StationFilterDto,
  NearbyStationsDto,
} from './dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';

@ApiTags('Stations')
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List stations with filters' })
  findAll(@Query() filter: StationFilterDto) {
    return this.stationsService.findAll(filter);
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby stations (Haversine)' })
  findNearby(@Query() dto: NearbyStationsDto) {
    return this.stationsService.findNearby(dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get station detail' })
  findOne(@Param('id') id: string) {
    return this.stationsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN, UserRole.RESPONSABLE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create station (admin/responsable)' })
  create(@Body() dto: CreateStationDto) {
    return this.stationsService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN, UserRole.RESPONSABLE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update station (admin/responsable)' })
  update(@Param('id') id: string, @Body() dto: UpdateStationDto) {
    return this.stationsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete station (admin)' })
  remove(@Param('id') id: string) {
    return this.stationsService.remove(id);
  }
}

// ========== ADMIN STATIONS ALIAS ==========
@ApiTags('Admin Stations')
@Controller('admin/stations')
export class AdminStationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all station stats' })
  getAllStats() {
    return this.stationsService.getAllStationStats();
  }

  @Get('global-stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get global station stats' })
  getGlobalStats() {
    return this.stationsService.getGlobalStationStats();
  }

  @Get(':id/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get stats for a specific station' })
  getStationStats(@Param('id') id: string) {
    return this.stationsService.getStationStats(id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  findAll(@Query() filter: StationFilterDto) {
    return this.stationsService.findAll(filter);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.stationsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  create(@Body() dto: CreateStationDto) {
    return this.stationsService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: UpdateStationDto) {
    return this.stationsService.update(id, dto);
  }
}

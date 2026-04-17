import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import {
  CreateIncidentDto,
  UpdateIncidentDto,
  ResolveIncidentDto,
  NotifyPassengersDto,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  /**
   * GET /incidents?status=open&page=1&limit=20&gareId=xxx&companyId=xxx
   * Used by Admin + Societe dashboards.
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('gareId') gareId?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.incidentsService.findAll({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      gareId,
      companyId,
    });
  }

  /**
   * GET /incidents/:id
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  /**
   * POST /incidents
   * Passenger or operator reports an incident.
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateIncidentDto) {
    // In production: extract reportedBy from JWT
    return this.incidentsService.create(dto);
  }

  /**
   * PUT /incidents/:id
   * Admin/operator updates incident details.
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIncidentDto) {
    return this.incidentsService.update(id, dto);
  }

  /**
   * POST /incidents/:id/resolve
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/resolve')
  resolve(@Param('id') id: string, @Body() dto: ResolveIncidentDto) {
    return this.incidentsService.resolve(id, dto);
  }

  /**
   * POST /incidents/:id/assign
   * Admin assigns an incident to a support agent.
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() body: { assignedTo: string; assignedToName?: string },
  ) {
    return this.incidentsService.assign(id, body);
  }

  /**
   * POST /incidents/:id/notify
   * Admin sends notification to affected passengers.
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/notify')
  notify(@Param('id') id: string, @Body() dto: NotifyPassengersDto) {
    return this.incidentsService.notifyPassengers(id, dto);
  }

  /**
   * POST /incidents/:id/validate
   * Societe manager validates or rejects an incident.
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/validate')
  validate(
    @Param('id') id: string,
    @Body()
    body: {
      validationStatus: 'validated' | 'rejected';
      validatedBy: string;
      validationComment?: string;
    },
  ) {
    return this.incidentsService.validate(id, body);
  }
}

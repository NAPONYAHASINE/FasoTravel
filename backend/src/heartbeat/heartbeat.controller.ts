import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HeartbeatService } from './heartbeat.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';

interface JwtRequest {
  user?: { operatorId?: string; sub?: string };
}

@ApiTags('Heartbeat')
@Controller('heartbeat')
export class HeartbeatController {
  constructor(private readonly heartbeatService: HeartbeatService) {}

  @Post('ping/:stationId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CAISSIER, UserRole.MANAGER, UserRole.RESPONSABLE)
  @ApiOperation({ summary: 'Cashier heartbeat ping — call every 30s' })
  ping(@Param('stationId') stationId: string, @Req() req: JwtRequest) {
    const userId = req.user?.sub ?? '';
    const operatorId = req.user?.operatorId ?? '';
    return this.heartbeatService.ping(userId, stationId, operatorId);
  }

  @Delete('disconnect/:stationId')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CAISSIER, UserRole.MANAGER, UserRole.RESPONSABLE)
  @ApiOperation({ summary: 'Cashier explicit disconnect' })
  async disconnect(
    @Param('stationId') stationId: string,
    @Req() req: JwtRequest,
  ) {
    await this.heartbeatService.disconnect(req.user?.sub ?? '', stationId);
    return { disconnected: true };
  }

  @Get('station/:stationId/status')
  @ApiOperation({
    summary: 'Check if a station has at least one online cashier',
  })
  async stationStatus(@Param('stationId') stationId: string) {
    const online = await this.heartbeatService.isStationOnline(stationId);
    const cashiers = await this.heartbeatService.getStationCashiers(stationId);
    return { stationId, online, cashierCount: cashiers.length };
  }

  @Get('operator/:operatorId/online-stations')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all stations with online cashiers for an operator',
  })
  async onlineStations(@Param('operatorId') operatorId: string) {
    const stations = await this.heartbeatService.getOnlineStations(operatorId);
    return { operatorId, onlineStations: stations };
  }
}

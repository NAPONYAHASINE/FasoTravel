import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { EmitLocationDto, ShareLocationDto } from './dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Tracking')
@Controller()
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  /**
   * Get cached route geometry for a trip (Google Directions cached in DB).
   */
  @Public()
  @Get('trips/:id/route')
  @ApiOperation({
    summary: 'Get route geometry (cached from Google Directions)',
  })
  getRoute(@Param('id') tripId: string) {
    return this.trackingService.getRoute(tripId);
  }

  /**
   * Passenger emits their position for the trip.
   * Only boarded passengers can emit. One emitter per car, with fallback rotation.
   * Frontend calls: POST /trips/:tripId/location/emit
   */
  @Post('trips/:id/location/emit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Emit live position (boarded passenger)' })
  emitLocation(@Param('id') tripId: string, @Body() dto: EmitLocationDto) {
    return this.trackingService.emitLocation(tripId, dto);
  }

  /**
   * Get current live position of a trip's vehicle.
   * Frontend VehicleService calls: GET /vehicle/trips/:tripId/location
   * Also accessible at: GET /trips/:id/location
   */
  @Public()
  @Get('trips/:id/location')
  @ApiOperation({ summary: 'Get current vehicle position' })
  getPosition(@Param('id') tripId: string) {
    const position = this.trackingService.getPosition(tripId);
    if (!position) {
      return { position: null, message: 'Aucune position disponible' };
    }
    return position;
  }

  /**
   * Alias route for frontend VehicleService compatibility.
   * Frontend calls: GET /vehicle/trips/:tripId/location
   */
  @Public()
  @Get('vehicle/trips/:id/location')
  @ApiOperation({ summary: 'Get vehicle position (alias)' })
  getVehiclePosition(@Param('id') tripId: string) {
    return this.getPosition(tripId);
  }

  /**
   * Check if trip position can be shared externally (within 5km of arrival).
   */
  @Public()
  @Get('trips/:id/can-share')
  @ApiOperation({ summary: 'Check if trip is shareable (5km rule)' })
  canShare(@Param('id') tripId: string) {
    return this.trackingService.canShare(tripId);
  }

  /**
   * Share passenger location with operator/driver.
   * Frontend calls: POST /share-location
   * Rules: Must have boarded ticket, trip progress >= 70%
   */
  @Post('share-location')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Share location with driver (near destination)' })
  shareLocation(@Body() dto: ShareLocationDto) {
    return this.trackingService.shareLocation(dto);
  }
}

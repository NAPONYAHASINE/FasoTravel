import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdsService } from './ads.service';
import {
  TrackImpressionDto,
  TrackClickDto,
  TrackConversionDto,
  CreateAdDto,
  UpdateAdDto,
} from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';

@ApiTags('Ads')
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  /**
   * GET /ads/active?page=&user_id=&is_new=
   * Get active ads, optionally filtered.
   */
  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Get active ads' })
  findActive(
    @Query('page') page?: string,
    @Query('user_id') userId?: string,
    @Query('is_new') isNew?: string,
  ) {
    return this.adsService.findActive(
      page,
      userId,
      isNew !== undefined ? isNew === 'true' : undefined,
    );
  }

  /**
   * GET /ads/:id
   */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get ad by ID' })
  findOne(@Param('id') id: string) {
    return this.adsService.findOne(id);
  }

  /**
   * POST /ads/:id/impression
   */
  @Post(':id/impression')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Track ad impression' })
  trackImpression(
    @Param('id') adId: string,
    @Body() dto: TrackImpressionDto,
    @CurrentUser('sub') userId?: string,
  ) {
    return this.adsService.trackImpression(adId, userId || undefined, dto);
  }

  /**
   * POST /ads/:id/click
   */
  @Post(':id/click')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Track ad click' })
  trackClick(
    @Param('id') adId: string,
    @Body() dto: TrackClickDto,
    @CurrentUser('sub') userId?: string,
  ) {
    return this.adsService.trackClick(adId, userId || undefined, dto);
  }

  /**
   * POST /ads/:id/conversion
   */
  @Post(':id/conversion')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track ad conversion' })
  trackConversion(
    @Param('id') adId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: TrackConversionDto,
  ) {
    return this.adsService.trackConversion(adId, userId, dto);
  }
}

/**
 * Admin controller for ads management.
 */
@ApiTags('Admin Ads')
@Controller('admin/advertisements')
@Roles(UserRole.SUPER_ADMIN)
export class AdminAdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all ads' })
  findAll() {
    return this.adsService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: get ad detail' })
  findOne(@Param('id') id: string) {
    return this.adsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: create ad' })
  create(@Body() dto: CreateAdDto) {
    return this.adsService.createAd(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: update ad' })
  update(@Param('id') id: string, @Body() dto: UpdateAdDto) {
    return this.adsService.updateAd(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: delete ad' })
  remove(@Param('id') id: string) {
    return this.adsService.deleteAd(id);
  }

  @Get(':id/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: get ad stats' })
  getStats(@Param('id') id: string) {
    return this.adsService.getStats(id);
  }
}

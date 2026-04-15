import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminExtrasService } from './admin-extras.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';
import {
  CreateStoryCircleDto,
  UpdateStoryCircleDto,
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
} from './dto';

// ========== STORY CIRCLES ==========
@ApiTags('Admin Story Circles')
@ApiBearerAuth()
@Controller('admin/story-circles')
@Roles(UserRole.SUPER_ADMIN)
export class AdminStoryCirclesController {
  constructor(private readonly service: AdminExtrasService) {}

  @Get()
  @ApiOperation({ summary: 'List story circles' })
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAllStoryCircles(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get story circle' })
  findOne(@Param('id') id: string) {
    return this.service.findOneStoryCircle(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create story circle' })
  create(@Body() dto: CreateStoryCircleDto) {
    return this.service.createStoryCircle(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update story circle' })
  update(@Param('id') id: string, @Body() dto: UpdateStoryCircleDto) {
    return this.service.updateStoryCircle(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete story circle' })
  remove(@Param('id') id: string) {
    return this.service.deleteStoryCircle(id);
  }
}

// ========== FEATURE FLAGS ==========
@ApiTags('Admin Feature Flags')
@ApiBearerAuth()
@Controller('admin/feature-flags')
@Roles(UserRole.SUPER_ADMIN)
export class AdminFeatureFlagsController {
  constructor(private readonly service: AdminExtrasService) {}

  @Get()
  @ApiOperation({ summary: 'List feature flags' })
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAllFeatureFlags(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get feature flag' })
  findOne(@Param('id') id: string) {
    return this.service.findOneFeatureFlag(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create feature flag' })
  create(@Body() dto: CreateFeatureFlagDto) {
    return this.service.createFeatureFlag(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update feature flag' })
  update(@Param('id') id: string, @Body() dto: UpdateFeatureFlagDto) {
    return this.service.updateFeatureFlag(id, dto);
  }

  @Put(':id/toggle')
  @ApiOperation({ summary: 'Toggle feature flag' })
  toggle(@Param('id') id: string) {
    return this.service.toggleFeatureFlag(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete feature flag' })
  remove(@Param('id') id: string) {
    return this.service.deleteFeatureFlag(id);
  }
}

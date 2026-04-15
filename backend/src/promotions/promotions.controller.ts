import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  ValidatePromotionDto,
  RejectPromotionDto,
} from './dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '../common/constants';

/**
 * Public promotions endpoint (used by Mobile at booking time).
 */
@ApiTags('Promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  /**
   * POST /promotions/validate — Validate a promo code.
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Validate a promotion code' })
  validateCode(@Body() dto: ValidatePromotionDto) {
    return this.promotionsService.validateCode(dto);
  }
}

/**
 * Admin promotions management.
 */
@ApiTags('Admin Promotions')
@Controller('admin/promotions')
@Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
export class AdminPromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all promotions' })
  findAll() {
    return this.promotionsService.findAll();
  }

  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: get promotion stats' })
  getStats() {
    return this.promotionsService.getStats();
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: get promotion detail' })
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: create promotion' })
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: update promotion' })
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.update(id, dto);
  }

  @Patch(':id/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: approve promotion' })
  approve(@Param('id') id: string) {
    return this.promotionsService.approve(id);
  }

  @Patch(':id/reject')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: reject promotion' })
  reject(@Param('id') id: string, @Body() _dto: RejectPromotionDto) {
    return this.promotionsService.reject(id);
  }

  @Patch(':id/activate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: activate promotion' })
  activate(@Param('id') id: string) {
    return this.promotionsService.activate(id);
  }

  @Patch(':id/deactivate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: deactivate promotion' })
  deactivate(@Param('id') id: string) {
    return this.promotionsService.deactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: delete promotion' })
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}

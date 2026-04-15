import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { OperatorsService } from './operators.service';
import {
  CreateOperatorDto,
  UpdateOperatorDto,
  CreateReviewDto,
  CreateOperatorServiceDto,
  UpdateOperatorServiceDto,
} from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '../common/constants';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Operators')
@Controller()
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  // ─── Public endpoints ─────────────────────────────────────────

  @Get('operators')
  @Public()
  @ApiOperation({ summary: 'List all active operators' })
  findAll(@Query() pagination: PaginationDto) {
    return this.operatorsService.findAll(pagination);
  }

  @Get('operators/:id')
  @Public()
  @ApiOperation({ summary: 'Get operator detail' })
  findOne(@Param('id') id: string) {
    return this.operatorsService.findOne(id);
  }

  @Get('operators/:id/services')
  @Public()
  @ApiOperation({ summary: 'Get operator additional services' })
  findServices(@Param('id') id: string) {
    return this.operatorsService.findServices(id);
  }

  @Get('operators/:id/stories')
  @Public()
  @ApiOperation({ summary: 'Get operator stories' })
  findStories(@Param('id') id: string) {
    return this.operatorsService.findStories(id);
  }

  @Get('operators/:id/reviews')
  @Public()
  @ApiOperation({ summary: 'Get operator reviews (paginated)' })
  findReviews(@Param('id') id: string, @Query() pagination: PaginationDto) {
    return this.operatorsService.findReviews(id, pagination);
  }

  @Get('operators/:id/policies')
  @Public()
  @ApiOperation({ summary: 'Get operator policies' })
  findPolicies(@Param('id') id: string) {
    return this.operatorsService.findPolicies(id);
  }

  // ─── Authenticated: Reviews ───────────────────────────────────

  @Post('reviews')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a completed trip' })
  createReview(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.operatorsService.createReview(userId, dto);
  }

  @Get('reviews/my-reviews')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my reviews' })
  findMyReviews(
    @CurrentUser('sub') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.operatorsService.findMyReviews(userId, pagination);
  }

  @Put('reviews/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my review' })
  updateReview(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: Partial<CreateReviewDto>,
  ) {
    return this.operatorsService.updateReview(id, userId, dto);
  }

  @Delete('reviews/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete my review' })
  deleteReview(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.operatorsService.deleteReview(id, userId);
  }

  // ─── Admin CRUD ───────────────────────────────────────────────

  @Get('admin/companies')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: List all companies' })
  findAllAdmin(@Query() pagination: PaginationDto) {
    return this.operatorsService.findAllAdmin(pagination);
  }

  @Get('admin/companies/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get company detail' })
  findOneAdmin(@Param('id') id: string) {
    return this.operatorsService.findOne(id);
  }

  @Post('admin/companies')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Create company' })
  create(@Body() dto: CreateOperatorDto) {
    return this.operatorsService.create(dto);
  }

  @Put('admin/companies/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Update company' })
  update(@Param('id') id: string, @Body() dto: UpdateOperatorDto) {
    return this.operatorsService.update(id, dto);
  }

  @Delete('admin/companies/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Delete company' })
  remove(@Param('id') id: string) {
    return this.operatorsService.remove(id);
  }

  @Post('admin/companies/:id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Approve company' })
  approve(@Param('id') id: string) {
    return this.operatorsService.approve(id);
  }

  @Post('admin/companies/:id/suspend')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Suspend company' })
  suspend(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.operatorsService.suspend(id, reason);
  }

  @Post('admin/companies/:id/logo')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Upload company logo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  uploadLogo(
    @Param('id') id: string,
    @UploadedFile()
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    return this.operatorsService.uploadLogo(id, file);
  }

  @Post('admin/companies/:id/toggle-status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Toggle company active/suspended status' })
  toggleStatus(@Param('id') id: string) {
    return this.operatorsService.toggleStatus(id);
  }

  @Get('admin/companies/:id/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get company statistics' })
  getStats(@Param('id') id: string) {
    return this.operatorsService.getOperatorStats(id);
  }
}

// ========== ADMIN REVIEWS ==========
@ApiTags('Admin Reviews')
@ApiBearerAuth()
@Controller('admin/reviews')
@Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
export class AdminReviewsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: List all reviews' })
  findAll(@Query() pagination: PaginationDto) {
    return this.operatorsService.findAllReviewsAdmin(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: Get review detail' })
  findOne(@Param('id') id: string) {
    return this.operatorsService.findOneReviewAdmin(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Delete review' })
  remove(@Param('id') id: string) {
    return this.operatorsService.deleteReviewAdmin(id);
  }
}

// ========== ADMIN OPERATOR-SERVICES ==========
@ApiTags('Admin Operator Services')
@ApiBearerAuth()
@Controller('admin/operator-services')
@Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
export class AdminOperatorServicesController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: List all operator services' })
  findAll(@Query() pagination: PaginationDto) {
    return this.operatorsService.findAllServicesAdmin(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: Get operator service detail' })
  findOne(@Param('id') id: string) {
    return this.operatorsService.findOneServiceAdmin(id);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: Create operator service' })
  create(@Body() dto: CreateOperatorServiceDto) {
    return this.operatorsService.createServiceAdmin(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Admin: Update operator service' })
  update(@Param('id') id: string, @Body() dto: UpdateOperatorServiceDto) {
    return this.operatorsService.updateServiceAdmin(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Delete operator service' })
  remove(@Param('id') id: string) {
    return this.operatorsService.deleteServiceAdmin(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { PoliciesService } from './policies.service';
import {
  OperatorPolicyQueryDto,
  CreateOperatorPolicyDto,
  UpdateComplianceDto,
  PlatformPolicyQueryDto,
  CreatePlatformPolicyDto,
  UpdatePlatformPolicyDto,
} from './dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '../common/constants';

// ========== OPERATOR POLICIES (Admin) ==========
@Controller('policies/operator')
@Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN)
export class OperatorPoliciesController {
  constructor(private readonly service: PoliciesService) {}

  @Get()
  findAll(@Query() query: OperatorPolicyQueryDto) {
    return this.service.findAllOperator(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOneOperator(id);
  }

  @Post()
  create(@Body() dto: CreateOperatorPolicyDto) {
    return this.service.createOperator(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateOperatorPolicyDto>,
  ) {
    return this.service.updateOperator(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.deleteOperator(id);
  }

  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.service.toggleOperatorStatus(id);
  }

  @Patch(':id/compliance')
  updateCompliance(@Param('id') id: string, @Body() dto: UpdateComplianceDto) {
    return this.service.updateCompliance(id, dto);
  }
}

// ========== PLATFORM POLICIES (Admin) ==========
@Controller('policies/platform')
export class PlatformPoliciesController {
  constructor(private readonly service: PoliciesService) {}

  @Get()
  @Public()
  findAll(@Query() query: PlatformPolicyQueryDto) {
    // If status=published, this is a public endpoint (mobile)
    if (query.status === 'published') {
      return this.service.getPublishedPolicies(query.status, query.scope);
    }
    return this.service.findAllPlatform(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOnePlatform(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() dto: CreatePlatformPolicyDto) {
    return this.service.createPlatform(dto);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdatePlatformPolicyDto) {
    return this.service.updatePlatform(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  delete(@Param('id') id: string) {
    return this.service.deletePlatform(id);
  }

  @Patch(':id/publish')
  @Roles(UserRole.SUPER_ADMIN)
  publish(@Param('id') id: string) {
    return this.service.publishPlatform(id);
  }

  @Patch(':id/archive')
  @Roles(UserRole.SUPER_ADMIN)
  archive(@Param('id') id: string) {
    return this.service.archivePlatform(id);
  }
}

// ========== ADMIN POLICIES ALIAS ==========
@Controller('admin/policies')
@Roles(UserRole.SUPER_ADMIN)
export class AdminPoliciesController {
  constructor(private readonly service: PoliciesService) {}

  @Get()
  findAll(@Query() query: PlatformPolicyQueryDto) {
    return this.service.findAllPlatform(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOnePlatform(id);
  }

  @Post()
  create(@Body() dto: CreatePlatformPolicyDto) {
    return this.service.createPlatform(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlatformPolicyDto) {
    return this.service.updatePlatform(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.deletePlatform(id);
  }
}

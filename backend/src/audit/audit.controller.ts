import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuditLogQueryDto, ExportLogsQueryDto } from './dto';

@Controller('logs')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Query() query: AuditLogQueryDto) {
    return this.auditService.findAll(query);
  }

  @Get('stats')
  getStats(@Query('dateRange') dateRange?: string) {
    return this.auditService.getStats(dateRange);
  }

  @Get('export')
  exportLogs(@Query() query: ExportLogsQueryDto) {
    return this.auditService.exportLogs(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditService.findOne(id);
  }
}

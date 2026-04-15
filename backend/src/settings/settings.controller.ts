import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';

@Controller('settings')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  getAll(@Query('category') category?: string) {
    if (category) return this.service.getByCategory(category);
    return this.service.getAll();
  }

  @Put()
  update(
    @Body() body: Record<string, any>,
    @Req() req: { user?: { sub?: string } },
  ) {
    return this.service.update(body, req.user?.sub);
  }

  @Post('logo')
  uploadLogo(
    @Body('url') url: string,
    @Req() req: { user?: { sub?: string } },
  ) {
    return this.service.uploadLogo(url, req.user?.sub);
  }

  @Get('export')
  exportSettings() {
    return this.service.exportSettings();
  }

  @Post('import')
  importSettings(
    @Body()
    body: {
      settings: { key: string; value: any; category?: string }[];
    },
  ) {
    return this.service.importSettings(body.settings ?? []);
  }
}

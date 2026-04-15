import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';
import { RolesGuard } from '../common/guards/roles.guard';
import { DashboardStatsQueryDto, FinancialMetricsQueryDto } from './dto';

@Controller()
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR_ADMIN, UserRole.FINANCE_ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /* ─── Dashboard ──────────────────────────────── */

  @Get('admin/dashboard/stats')
  getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }

  /* ─── Analytics ──────────────────────────────── */

  @Get('admin/analytics/platform')
  getPlatformGrowth(@Query() query: DashboardStatsQueryDto) {
    return this.dashboardService.getPlatformGrowthMetrics({
      period: query.period,
      includeStations: true,
    });
  }

  @Get('admin/analytics/registrations')
  getWeeklyRegistrations(@Query() query: DashboardStatsQueryDto) {
    return this.dashboardService.getWeeklyRegistrations(query.period ?? 'week');
  }

  @Get('admin/analytics/stations/activity')
  getStationActivity(@Query('limit') limit?: string) {
    return this.dashboardService.getStationActivities(
      limit ? Number(limit) : 5,
    );
  }

  /* ─── Financial ──────────────────────────────── */

  @Get('admin/financial/metrics')
  getFinancialMetrics(@Query() query: FinancialMetricsQueryDto) {
    return this.dashboardService.getFinancialMetrics({
      period: query.period,
      companyId: query.companyId,
      includeDetails: query.includeDetails,
    });
  }

  @Get('admin/financial/daily-revenue')
  getDailyRevenue(@Query('period') period?: string) {
    return this.dashboardService.getDailyRevenue(period ?? 'month');
  }

  @Get('admin/financial/payment-methods')
  getPaymentMethodStats() {
    return this.dashboardService.getPaymentMethodStats();
  }

  @Get('admin/financial/top-companies')
  getTopCompanies(@Query('limit') limit?: string) {
    return this.dashboardService.getTopCompaniesByRevenue(
      limit ? Number(limit) : 5,
    );
  }
}

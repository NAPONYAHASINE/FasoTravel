import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, WebhookPaymentDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '../common/constants';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Payments')
@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  // ─── Mobile endpoints ──────────────────────────────────────────

  @Post('payments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate a payment for a booking' })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(userId, dto);
  }

  @Get('payments/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment detail' })
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Get('payment-methods')
  @Public()
  @ApiOperation({ summary: 'List available payment methods' })
  getPaymentMethods() {
    return this.paymentsService.getPaymentMethods();
  }

  // ─── Webhook (public, verified by signature) ──────────────────

  @Post('payments/webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment provider webhook (PaydunYa IPN)' })
  async webhook(
    @Body() dto: WebhookPaymentDto,
    @Headers('x-paydunya-signature') signature: string,
  ) {
    // In production: verify signature against PAYDUNYA_MASTER_KEY
    if (!dto.token) {
      throw new BadRequestException('Missing provider token');
    }

    this.logger.log(
      `Webhook received: event=${dto.event} token=${dto.token} sig=${signature ? 'present' : 'missing'}`,
    );

    const providerStatus =
      dto.event === 'invoice.completed' || dto.status === 'completed'
        ? 'completed'
        : 'failed';

    return this.paymentsService.processWebhook(
      dto.token,
      providerStatus,
      dto.custom_data,
    );
  }

  // ─── Admin endpoints ──────────────────────────────────────────

  @Get('admin/payments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: List all payments (paginated)' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('method') method?: string,
    @Query('search') search?: string,
  ) {
    return this.paymentsService.findAll(pagination, {
      status,
      method,
      search,
    });
  }

  @Get('admin/payments/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Revenue statistics' })
  async getStats() {
    return this.paymentsService.getRevenueStats();
  }

  @Get('admin/payments/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Payment detail' })
  async adminFindOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post('admin/payments/:id/refund')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Refund a completed payment' })
  async refund(@Param('id') id: string, @Body('reason') reason: string) {
    if (!reason) {
      throw new BadRequestException('Refund reason is required');
    }
    return this.paymentsService.refund(id, reason);
  }

  @Post('admin/payments/:id/retry')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Retry a failed payment' })
  async retry(@Param('id') id: string) {
    return this.paymentsService.retry(id);
  }
}

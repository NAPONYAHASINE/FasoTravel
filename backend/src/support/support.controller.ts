import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { SupportService } from './support.service';
import {
  SupportTicketQueryDto,
  AssignTicketDto,
  ResolveTicketDto,
  UpdatePriorityDto,
  UpdateStatusDto,
  AddReplyDto,
  CreateSupportMessageDto,
  AssistantChatDto,
} from './dto';
import { AiAssistantService } from './ai/ai-assistant.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants';

// ========== ADMIN SUPPORT ==========
@Controller('admin/support')
@Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
export class AdminSupportController {
  constructor(
    private readonly service: SupportService,
    private readonly aiAssistant: AiAssistantService,
  ) {}

  @Get()
  findAll(@Query() query: SupportTicketQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignTicketDto) {
    return this.service.assign(id, dto);
  }

  @Post(':id/resolve')
  resolve(@Param('id') id: string, @Body() dto: ResolveTicketDto) {
    return this.service.resolve(id, dto);
  }

  @Patch(':id')
  updatePriority(@Param('id') id: string, @Body() dto: UpdatePriorityDto) {
    return this.service.updatePriority(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Post(':id/reply')
  addReply(@Param('id') id: string, @Body() dto: AddReplyDto) {
    return this.service.addReply(id, dto);
  }

  @Get('conversations/escalated')
  getEscalatedConversations() {
    return this.aiAssistant.getEscalatedConversations();
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string) {
    return this.aiAssistant.getConversation(id);
  }
}

// ========== MOBILE SUPPORT ==========
@Controller('support')
export class MobileSupportController {
  constructor(
    private readonly service: SupportService,
    private readonly aiAssistant: AiAssistantService,
  ) {}

  @Post('messages')
  sendMessage(
    @Body() dto: CreateSupportMessageDto,
    @Req() req: { user?: { sub?: string } },
  ) {
    return this.service.createFromMobile(req.user?.sub ?? '', dto);
  }

  @Get('messages/my-messages')
  getMyMessages(@Req() req: { user?: { sub?: string } }) {
    return this.service.getMyTickets(req.user?.sub ?? '');
  }

  @Post('incidents')
  reportIncident(
    @Body() dto: CreateSupportMessageDto,
    @Req() req: { user?: { sub?: string } },
  ) {
    return this.service.createIncidentFromMobile(req.user?.sub ?? '', dto);
  }

  @Get('incidents/my-incidents')
  getMyIncidents(@Req() req: { user?: { sub?: string } }) {
    return this.service.getMyIncidents(req.user?.sub ?? '');
  }

  @Get('incidents/:id')
  getIncident(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('incidents/:id/close')
  closeIncident(@Param('id') id: string) {
    return this.service.closeTicket(id);
  }

  @Post('assistant/chat')
  assistantChat(
    @Body() dto: AssistantChatDto,
    @Req() req: { user?: { sub?: string } },
  ) {
    return this.aiAssistant.chat(
      dto.message,
      dto.conversationId,
      req.user?.sub,
      dto.metadata?.userEmail,
    );
  }
}

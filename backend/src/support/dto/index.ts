import { IsOptional, IsString, IsIn, IsArray } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateSupportTicketDto {
  @IsString()
  subject: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsIn(['booking', 'payment', 'technical', 'feedback', 'other'])
  category?: string;

  @IsOptional()
  @IsArray()
  attachments?: string[];
}

export class SupportTicketQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(['open', 'in-progress', 'resolved', 'closed'])
  status?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent', 'normal'])
  priority?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class AssignTicketDto {
  @IsString()
  adminId: string;
}

export class ResolveTicketDto {
  @IsString()
  resolution: string;
}

export class UpdatePriorityDto {
  @IsIn(['low', 'medium', 'high', 'urgent', 'normal'])
  priority: string;
}

export class UpdateStatusDto {
  @IsIn(['open', 'in-progress', 'resolved', 'closed'])
  status: string;
}

export class AddReplyDto {
  @IsString()
  authorId: string;

  @IsString()
  authorName: string;

  @IsIn(['admin', 'user'])
  authorRole: string;

  @IsString()
  message: string;
}

// Mobile support message
export class CreateSupportMessageDto {
  @IsString()
  subject: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsIn(['BOOKING', 'PAYMENT', 'TICKET', 'VEHICLE', 'OTHER'])
  category?: string;

  @IsOptional()
  @IsArray()
  attachments?: string[];
}

// AI Assistant chat
export class AssistantChatDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  metadata?: {
    userEmail?: string;
    channel?: string;
  };
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  SupportTicket,
  User,
  KnowledgeArticle,
  AssistantConversation,
} from '../database/entities';
import { SupportService } from './support.service';
import { RagService } from './ai/rag.service';
import { AiAssistantService } from './ai/ai-assistant.service';
import {
  AdminSupportController,
  MobileSupportController,
} from './support.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupportTicket,
      User,
      KnowledgeArticle,
      AssistantConversation,
    ]),
  ],
  controllers: [AdminSupportController, MobileSupportController],
  providers: [SupportService, RagService, AiAssistantService],
  exports: [SupportService, AiAssistantService],
})
export class SupportModule {}

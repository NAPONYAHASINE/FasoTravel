import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: string[];
  confidence?: number;
}

/**
 * Stores assistant conversation sessions.
 * Each conversation has an array of messages (user ↔ bot).
 * When escalated, the ticket is linked via escalatedTicketId.
 */
@Entity('assistant_conversations')
export class AssistantConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'user_email', type: 'varchar', length: 255, nullable: true })
  userEmail: string;

  /** Full conversation history */
  @Column({ type: 'jsonb', default: '[]' })
  messages: ConversationMessage[];

  /** Whether the conversation was escalated to a human */
  @Column({ name: 'is_escalated', type: 'boolean', default: false })
  isEscalated: boolean;

  /** Linked support ticket when escalated */
  @Column({
    name: 'escalated_ticket_id',
    type: 'uuid',
    nullable: true,
  })
  escalatedTicketId: string;

  /** Escalation reason */
  @Column({ name: 'escalation_reason', type: 'text', nullable: true })
  escalationReason: string;

  /** Current status */
  @Column({
    type: 'varchar',
    length: 30,
    default: 'active',
  })
  status: string; // 'active' | 'escalated' | 'closed'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

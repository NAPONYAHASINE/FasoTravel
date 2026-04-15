import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Knowledge base article used for RAG-powered AI assistant.
 * Each row is a chunk of documentation with its embedding vector.
 */
@Entity('knowledge_articles')
export class KnowledgeArticle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Section/topic: 'reservation', 'annulation', 'paiement', 'incident', 'general', etc. */
  @Index()
  @Column({ type: 'varchar', length: 100 })
  category: string;

  /** Short title for admin display */
  @Column({ type: 'varchar', length: 255 })
  title: string;

  /** The actual text content (chunk) used for retrieval */
  @Column({ type: 'text' })
  content: string;

  /** Pre-computed embedding vector stored as float array (JSON).
   *  In production with pgvector, this would be a vector column. */
  @Column({ type: 'jsonb', nullable: true })
  embedding: number[];

  /** Metadata: source document, page, etc. */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  /** Language of the content */
  @Column({ type: 'varchar', length: 10, default: 'fr' })
  language: string;

  /** Whether this article is active */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

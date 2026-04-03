import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('story_views')
export class StoryView {
  @PrimaryColumn({ name: 'user_id', type: 'varchar', length: 255 })
  userId: string;

  @PrimaryColumn({ name: 'story_id', type: 'varchar', length: 255 })
  storyId: string;

  @ManyToOne('OperatorStory', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'story_id' })
  story: any;

  @Column({
    name: 'viewed_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  viewedAt: Date;
}

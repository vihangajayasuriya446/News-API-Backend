import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Article } from './article.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class ArticleLike {
  @PrimaryColumn()
  article_id: number;

  @PrimaryColumn()
  user_id: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Article, article => article.likes)
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
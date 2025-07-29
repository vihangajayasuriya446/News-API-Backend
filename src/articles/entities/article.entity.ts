// src/articles/entities/article.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { ArticleLike } from './article-like.entity';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column('text')
  content: string;

  @Column({ nullable: true, type: 'text' }) 
  excerpt: string | null;

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn({ name: 'category_id' })
  @Index()
  category: Category;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ type: 'longtext', nullable: true }) // FIX: Change to 'longtext'
  featured_image: string | null; 

  @Column({ default: 0 })
  @Index()
  view_count: number;

  @Column({ default: 0 })
  @Index()
  like_count: number;

  @Column({ default: false })
  @Index()
  is_published: boolean;

  @Column({ nullable: true, type: 'datetime' }) 
  @Index()
  published_at: Date | null; 

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => ArticleLike, like => like.article)
  likes: ArticleLike[];
}
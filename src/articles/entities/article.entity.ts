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

  @Column({ nullable: true })
  excerpt: string;

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn({ name: 'category_id' })
  @Index()
  category: Category;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ type: 'varchar', nullable: true })
  featured_image: string;

  @Column({ default: 0 })
  @Index()
  view_count: number;

  @Column({ default: 0 })
  @Index()
  like_count: number;

  @Column({ default: false })
  @Index()
  is_published: boolean;

  @Column({ nullable: true })
  @Index()
  published_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => ArticleLike, like => like.article)
  likes: ArticleLike[];
}
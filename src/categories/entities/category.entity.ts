import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Article } from '../../articles/entities/article.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Article, article => article.category)
  articles: Article[];
}
// src/articles/dto/article-response.dto.ts
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';

export class ArticleResponseDto {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null; // FIX: Allow null for excerpt if nullable in entity
  category: CategoryResponseDto;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  featured_image?: string | null; // FIX: Allow null for featured_image
  view_count: number;
  like_count: number;
  is_published: boolean;
  published_at?: Date | null; // FIX: Allow null for published_at
  created_at: Date;
  updated_at: Date;
}
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';

export class ArticleResponseDto {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: CategoryResponseDto;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  featured_image?: string;
  view_count: number;
  like_count: number;
  is_published: boolean;
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
}
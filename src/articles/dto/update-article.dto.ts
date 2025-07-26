import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsBoolean()
  is_published?: boolean;

  @IsOptional()
  @IsString()
  featured_image?: string;
}
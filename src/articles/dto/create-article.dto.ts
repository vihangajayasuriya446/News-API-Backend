import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class CreateArticleDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @IsOptional()
  @IsBoolean()
  is_published?: boolean = false;

  @IsOptional()
  @IsString()
  featured_image?: string;
}
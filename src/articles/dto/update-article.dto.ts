// src/articles/dto/update-article.dto.ts
import { IsOptional, IsString, IsBoolean, IsNumber, IsBooleanString } from 'class-validator';

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
  featured_image?: string | null; // Can be a base64 string or null (to clear it)

  // This property is used to signal from the frontend to clear the existing image.
  // It's received as a string 'true'/'false' from FormData.
  // Although we parse it in controller, having it here can help with documentation.
  // Note: if you use ValidationPipe with transform: true, it might attempt to convert
  // this string to boolean automatically, but manual parsing in controller is safer for FormData.
  @IsOptional()
  @IsBoolean() // Assuming it will be boolean after manual conversion in controller
  clearImage?: boolean;
}
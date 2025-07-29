// src/articles/controllers/articles.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Put,
  Delete,
  ParseIntPipe,
  DefaultValuePipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArticlesService } from '../services/articles.service';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../shared/constants/roles.enum';
import { ArticleResponseDto } from '../dto/article-response.dto';
import { User } from '../../users/entities/user.entity';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/temp', // Ensure this directory exists and is writable
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return cb(new BadRequestException('Only image files (JPG, JPEG, PNG) are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  }))
  async create(
    @Body() body: any, // Use 'any' to access raw form data as strings
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ArticleResponseDto> {
    // Manually parse values from 'body' (which come as strings from FormData)
    const createArticleDto: CreateArticleDto = {
      title: body.title,
      content: body.content,
      excerpt: body.excerpt || undefined, // Use undefined if empty string
      categoryId: parseInt(body.categoryId, 10), // Convert to number
      is_published: body.is_published === 'true', // Convert string "true"/"false" to boolean
      // featured_image will be set below if a file is uploaded
    };

    if (file) {
      try {
        const imageBuffer = fs.readFileSync(file.path);
        const base64Image = imageBuffer.toString('base64');
        createArticleDto.featured_image = `data:${file.mimetype};base64,${base64Image}`;
        fs.unlinkSync(file.path); // Clean up temp file
      } catch (error) {
        throw new BadRequestException('Error processing image: ' + error.message);
      }
    }

    return this.articlesService.create(createArticleDto, req.user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/temp', // Ensure this directory exists and is writable
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return cb(new BadRequestException('Only image files (JPG, JPEG, PNG) are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any, // Use 'any' to access raw form data as strings
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ArticleResponseDto> {
    // Manually parse values for UpdateArticleDto
    const updateArticleDto: UpdateArticleDto = {
      title: body.title || undefined,
      content: body.content || undefined,
      excerpt: body.excerpt || undefined,
      categoryId: body.categoryId ? parseInt(body.categoryId, 10) : undefined,
      is_published: body.is_published !== undefined ? (body.is_published === 'true') : undefined,
      // featured_image will be handled below based on file or clearImage flag
    };

    if (file) {
      try {
        const imageBuffer = fs.readFileSync(file.path);
        const base64Image = imageBuffer.toString('base64');
        updateArticleDto.featured_image = `data:${file.mimetype};base64,${base64Image}`;
        fs.unlinkSync(file.path); // Clean up temp file
      } catch (error) {
        throw new BadRequestException('Error processing image: ' + error.message);
      }
    } else if (body.clearImage === 'true') {
        // Frontend sent 'clearImage=true', so set featured_image to null to remove it
        updateArticleDto.featured_image = null;
    } else {
        // If no new file and no clearImage flag, don't touch featured_image in DTO
        // This means the service will keep the existing image
        updateArticleDto.featured_image = undefined; // Ensure it's not set to anything if no change
    }


    return this.articlesService.update(id, updateArticleDto);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sort') sortBy: 'newest' | 'oldest' | 'views' | 'likes' = 'newest',
    @Query('categories') categories?: string,
    @Query('published') published?: string, // Made optional
  ) {
    const categoryIds = categories ? categories.split(',').map(Number) : undefined;
    // Only apply published filter if explicitly requested
    const publishedFilter = published !== undefined ? published === 'true' : undefined;
    return this.articlesService.findAll(
      page,
      limit,
      sortBy,
      categoryIds,
      publishedFilter,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ArticleResponseDto> {
    // The 'true' parameter indicates to increment view count on retrieval,
    // which is suitable for public article viewing, but for editing, it's generally false.
    // For admin edit purposes, it should probably be false unless specifically desired.
    // Assuming for 'edit' page, we don't want to increment views.
    return this.articlesService.findOne(id, false); // Changed to false to not increment view on edit page load
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.articlesService.delete(id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  toggleLike(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.articlesService.toggleLike(id, req.user.id);
  }
}
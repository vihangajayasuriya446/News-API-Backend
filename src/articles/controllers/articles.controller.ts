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
      destination: './uploads/temp',
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
    @Body() body: any,
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ArticleResponseDto> {
    const createArticleDto: CreateArticleDto = {
      title: body.title,
      content: body.content,
      excerpt: body.excerpt || undefined,
      categoryId: parseInt(body.categoryId, 10),
      is_published: body.is_published === 'true',
    };

    if (file) {
      try {
        const imageBuffer = fs.readFileSync(file.path);
        const base64Image = imageBuffer.toString('base64');
        createArticleDto.featured_image = `data:${file.mimetype};base64,${base64Image}`;
        fs.unlinkSync(file.path);
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
      destination: './uploads/temp',
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
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ArticleResponseDto> {
    const updateArticleDto: UpdateArticleDto = {
      title: body.title || undefined,
      content: body.content || undefined,
      excerpt: body.excerpt || undefined,
      categoryId: body.categoryId ? parseInt(body.categoryId, 10) : undefined,
      is_published: body.is_published !== undefined ? (body.is_published === 'true') : undefined,
    };

    if (file) {
      try {
        const imageBuffer = fs.readFileSync(file.path);
        const base64Image = imageBuffer.toString('base64');
        updateArticleDto.featured_image = `data:${file.mimetype};base64,${base64Image}`;
        fs.unlinkSync(file.path);
      } catch (error) {
        throw new BadRequestException('Error processing image: ' + error.message);
      }
    } else if (body.clearImage === 'true') {
      updateArticleDto.featured_image = null;
    }

    return this.articlesService.update(id, updateArticleDto);
  }

 @Get('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.EDITOR, Role.ADMIN)
adminFindAll(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  @Query('sort') sortBy: 'newest' | 'oldest' | 'views' | 'likes' = 'newest',
  @Query('categories') categories?: string,
  @Query('search') search?: string
) {
  const categoryIds = categories ? categories.split(',').map(Number) : undefined;
  return this.articlesService.findAll(
    page,
    limit,
    sortBy,
    categoryIds,
    undefined, // Explicitly pass undefined to ignore published status
    search
  );
}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN, Role.USER)
  publicFindAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sort') sortBy: 'newest' | 'oldest' | 'views' | 'likes' = 'newest',
    @Query('categories') categories?: string,
    @Query('search') search?: string
  ) {
    const categoryIds = categories ? categories.split(',').map(Number) : undefined;
    return this.articlesService.findAll(
      page,
      limit,
      sortBy,
      categoryIds,
      true,
      search
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ArticleResponseDto> {
    return this.articlesService.findOne(id, false);
  }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles(Role.EDITOR, Role.ADMIN, Role.USER)
  async incrementViewCount(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ view_count: number }> {
    const article = await this.articlesService.incrementViewCount(id);
    return { view_count: article.view_count };
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

  @Get(':id/like-status')
  @UseGuards(JwtAuthGuard)
  async getLikeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const like = await this.articlesService.getLikeStatus(id, req.user.id);
    return { isLiked: !!like };
  }

  
}
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
} from '@nestjs/common';
import { ArticlesService } from '../services/articles.service';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../shared/constants/roles.enum';
import { ArticleResponseDto } from '../dto/article-response.dto';
import { User } from '../../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  create(
    @Body() createArticleDto: CreateArticleDto,
    @Req() req: RequestWithUser,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.create(createArticleDto, req.user);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sort') sortBy: 'newest' | 'oldest' | 'views' | 'likes' = 'newest',
    @Query('categories') categories?: string,
    @Query('published') published: string = 'true',
  ) {
    const categoryIds = categories ? categories.split(',').map(Number) : undefined;
    return this.articlesService.findAll(
      page,
      limit,
      sortBy,
      categoryIds,
      published === 'true',
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ArticleResponseDto> {
    return this.articlesService.findOne(id, true);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.update(id, updateArticleDto);
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
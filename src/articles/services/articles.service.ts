// src/articles/services/articles.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../entities/article.entity';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import { ArticleResponseDto } from '../dto/article-response.dto';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { ArticleLike } from '../entities/article-like.entity';
import { isBase64 } from 'class-validator';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private articlesRepository: Repository<Article>,
    @InjectRepository(ArticleLike)
    private articleLikesRepository: Repository<ArticleLike>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(createArticleDto: CreateArticleDto, user: User): Promise<ArticleResponseDto> {
    const category = await this.categoriesRepository.findOne({ where: { id: createArticleDto.categoryId } });
    if (!category) {
      throw new BadRequestException('Category not found.');
    }

    const newArticle = this.articlesRepository.create({
      ...createArticleDto,
      author: user, // Set the author based on the logged-in user
      category: category,
      slug: this.generateSlug(createArticleDto.title), // Generate slug from title
      published_at: createArticleDto.is_published ? new Date() : null, // Set published_at if published
    });

    try {
      const savedArticle = await this.articlesRepository.save(newArticle);
      return this.mapArticleToResponseDto(savedArticle);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('slug')) {
        throw new BadRequestException('An article with this title (slug) already exists.');
      }
      throw error;
    }
  }

  async findAll(
    page: number,
    limit: number,
    sortBy: 'newest' | 'oldest' | 'views' | 'likes',
    categoryIds?: number[],
    published?: boolean,
  ): Promise<{ articles: ArticleResponseDto[]; count: number }> {
    const queryBuilder = this.articlesRepository.createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.author', 'author');

    if (categoryIds && categoryIds.length > 0) {
      queryBuilder.andWhere('category.id IN (:...categoryIds)', { categoryIds });
    }

    if (published !== undefined) {
      queryBuilder.andWhere('article.is_published = :published', { published });
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        queryBuilder.orderBy('article.created_at', 'DESC');
        break;
      case 'oldest':
        queryBuilder.orderBy('article.created_at', 'ASC');
        break;
      case 'views':
        queryBuilder.orderBy('article.view_count', 'DESC');
        break;
      case 'likes':
        queryBuilder.orderBy('article.like_count', 'DESC');
        break;
      default:
        queryBuilder.orderBy('article.created_at', 'DESC');
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [articles, count] = await queryBuilder.getManyAndCount();

    return {
      articles: articles.map(article => this.mapArticleToResponseDto(article)),
      count,
    };
  }

  async findOne(id: number, incrementView: boolean = false): Promise<ArticleResponseDto> {
    const article = await this.articlesRepository.findOne({
      where: { id },
      // Eager loading is set in the Article entity, so relations should be loaded automatically
      // explicitly adding relations here ensures it if eager loading is ever removed or overridden.
      relations: ['category', 'author'],
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found.`);
    }

    if (incrementView) {
      article.view_count++;
      await this.articlesRepository.save(article);
    }

    return this.mapArticleToResponseDto(article);
  }

  async update(id: number, updateArticleDto: UpdateArticleDto): Promise<ArticleResponseDto> {
    const article = await this.articlesRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found.`);
    }

    if (updateArticleDto.categoryId) {
      const category = await this.categoriesRepository.findOne({ where: { id: updateArticleDto.categoryId } });
      if (!category) {
        throw new BadRequestException('Category not found.');
      }
      article.category = category;
    }

    // Handle featured_image: base64 string or null (for clearing)
    if (updateArticleDto.featured_image !== undefined) {
      article.featured_image = updateArticleDto.featured_image;
    } else if (updateArticleDto.clearImage === true) {
      // If clearImage flag is true, set featured_image to null
      article.featured_image = null;
    }

    // Update slug only if title is changed
    if (updateArticleDto.title && updateArticleDto.title !== article.title) {
      article.slug = this.generateSlug(updateArticleDto.title);
    }

    // Update published_at timestamp if is_published changes to true
    if (updateArticleDto.is_published === true && article.is_published === false) {
      article.published_at = new Date();
    } else if (updateArticleDto.is_published === false) {
      article.published_at = null; // Clear published_at if unpublished
    }

    // Apply other updates
    Object.assign(article, updateArticleDto);

    try {
      const updatedArticle = await this.articlesRepository.save(article);
      return this.mapArticleToResponseDto(updatedArticle);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('slug')) {
        throw new BadRequestException('An article with this title (slug) already exists.');
      }
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    const result = await this.articlesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Article with ID ${id} not found.`);
    }
  }

  async toggleLike(articleId: number, userId: number): Promise<{ likes: number; isLiked: boolean }> {
    const article = await this.articlesRepository.findOne({ where: { id: articleId } });
    if (!article) {
      throw new NotFoundException(`Article with ID ${articleId} not found.`);
    }

    const existingLike = await this.articleLikesRepository.findOne({
      where: { article: { id: articleId }, user: { id: userId } },
    });

    if (existingLike) {
      // Unlike
      await this.articleLikesRepository.remove(existingLike);
      article.like_count--;
      await this.articlesRepository.save(article);
      return { likes: article.like_count, isLiked: false };
    } else {
      // Like
      const newLike = this.articleLikesRepository.create({
        article: { id: articleId },
        user: { id: userId },
      });
      await this.articleLikesRepository.save(newLike);
      article.like_count++;
      await this.articlesRepository.save(article);
      return { likes: article.like_count, isLiked: true };
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove non-alphanumeric characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Remove duplicate hyphens
  }

  private mapArticleToResponseDto(article: Article): ArticleResponseDto {
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      category: {
        id: article.category.id,
        name: article.category.name,
        description: article.category.description
      },
      author: {
        id: article.author.id,
        firstName: article.author.firstName,
        lastName: article.author.lastName,
        email: article.author.email
      },
      featured_image: article.featured_image === null ? undefined : article.featured_image, // Map null to undefined for ResponseDto
      view_count: article.view_count,
      like_count: article.like_count,
      is_published: article.is_published,
      published_at: article.published_at || undefined, // published_at can be null, map to undefined for ResponseDto
      created_at: article.created_at,
      updated_at: article.updated_at
    };
  }
}
// src/articles/services/articles.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../entities/article.entity';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import { User } from '../../users/entities/user.entity';
import { ArticleLike } from '../entities/article-like.entity';
import { ArticleResponseDto } from '../dto/article-response.dto';
import { CategoriesService } from '../../categories/services/categories.service';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(ArticleLike)
    private readonly likeRepository: Repository<ArticleLike>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(createArticleDto: CreateArticleDto, author: User): Promise<ArticleResponseDto> {
    const category = await this.categoriesService.findOne(createArticleDto.categoryId);
    
    const article = new Article();
    Object.assign(article, {
      ...createArticleDto,
      author,
      category,
      slug: this.generateSlug(createArticleDto.title),
      // If is_published is true, set current date, otherwise null.
      // This matches the Article entity's `published_at: Date | null`
      published_at: createArticleDto.is_published ? new Date() : null 
    });
    
    const savedArticle = await this.articleRepository.save(article);
    return this.mapToResponseDto(savedArticle);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    sortBy: 'newest' | 'oldest' | 'views' | 'likes' = 'newest',
    categoryIds?: number[],
    isPublished: boolean = true,
  ): Promise<{ articles: ArticleResponseDto[]; count: number }> {
    const query = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.category', 'category')
      .where('article.is_published = :isPublished', { isPublished });

    if (categoryIds?.length) {
      query.andWhere('article.category_id IN (:...categoryIds)', { categoryIds });
    }

    switch (sortBy) {
      case 'newest':
        query.orderBy('article.published_at', 'DESC');
        break;
      case 'oldest':
        query.orderBy('article.published_at', 'ASC');
        break;
      case 'views':
        query.orderBy('article.view_count', 'DESC');
        break;
      case 'likes':
        query.orderBy('article.like_count', 'DESC');
        break;
    }

    const [articles, count] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      articles: articles.map(article => this.mapToResponseDto(article)),
      count
    };
  }

  async findOne(id: number, incrementViews = false): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['author', 'category'],
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (incrementViews) {
      article.view_count += 1;
      await this.articleRepository.save(article);
    }

    return this.mapToResponseDto(article);
  }

  async update(id: number, updateArticleDto: UpdateArticleDto): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['category'], // Load category to update it
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (updateArticleDto.categoryId) {
      article.category = await this.categoriesService.findOne(updateArticleDto.categoryId);
    }

    // Apply updates from DTO
    // Note: Object.assign handles undefined values by not overwriting existing properties
    // This assumes updateArticleDto fields are 'undefined' if not provided,
    // which our controller correctly ensures by using `body.prop || undefined`.
    Object.assign(article, updateArticleDto);

    // Explicitly handle featured_image if it was passed (either new base64 string or null for clearing)
    // If updateArticleDto.featured_image is undefined, it means no change to image.
    if (updateArticleDto.featured_image !== undefined) {
      article.featured_image = updateArticleDto.featured_image; 
    }

    if (updateArticleDto.title) {
      article.slug = this.generateSlug(updateArticleDto.title);
    }

    // Handle is_published updates and published_at date correctly
    if (updateArticleDto.is_published !== undefined) {
      article.published_at = updateArticleDto.is_published 
        ? (article.is_published ? article.published_at : new Date()) // If publishing, set new date if not already published
        : null; // If unpublishing (is_published is false), set to null
    }

    const updatedArticle = await this.articleRepository.save(article);
    return this.mapToResponseDto(updatedArticle);
  }

  async delete(id: number): Promise<void> {
    const result = await this.articleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Article not found');
    }
  }

  async toggleLike(articleId: number, userId: number): Promise<{ likes: number, isLiked: boolean }> {
    const article = await this.articleRepository.findOne({ where: { id: articleId } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const existingLike = await this.likeRepository.findOne({
      where: { article_id: articleId, user_id: userId }
    });

    if (existingLike) {
      await this.likeRepository.delete({ article_id: articleId, user_id: userId });
      article.like_count = Math.max(0, article.like_count - 1);
    } else {
      await this.likeRepository.save({
        article_id: articleId,
        user_id: userId
      });
      article.like_count += 1;
    }

    await this.articleRepository.save(article);
    return { 
      likes: article.like_count,
      isLiked: !existingLike
    };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');
  }

  private mapToResponseDto(article: Article): ArticleResponseDto {
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
      featured_image: article.featured_image === null ? undefined : article.featured_image, // Fix: Map null to undefined for ResponseDto
      view_count: article.view_count,
      like_count: article.like_count,
      is_published: article.is_published,
      published_at: article.published_at || undefined, // Fix: published_at can be null, map to undefined for ResponseDto
      created_at: article.created_at,
      updated_at: article.updated_at
    };
  }
}
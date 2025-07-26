import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CategoryResponseDto } from '../dto/category-response.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.articles', 'articles')
      .loadRelationCountAndMap('category.articleCount', 'category.articles')
      .getMany();

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      articleCount: (category as any).articleCount,
    }));
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }
}
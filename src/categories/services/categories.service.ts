import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepository.findOne({ 
      where: { name: createCategoryDto.name } 
    });
    
    if (existing) {
      throw new ConflictException('Category already exists');
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

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

  async delete(id: number): Promise<void> {
    // Check if category exists
    const category = await this.categoryRepository.findOne({ 
      where: { id },
      relations: ['articles'] 
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has articles
    if (category.articles && category.articles.length > 0) {
      throw new ConflictException('Cannot delete category with associated articles');
    }

    await this.categoryRepository.delete(id);
  }
  
    async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id); // This will throw NotFoundException if not found
    
    // Check if new name conflicts with existing category
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.categoryRepository.findOne({ 
        where: { name: updateCategoryDto.name } 
      });
      
      if (existing) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    // Update the category
    const updated = await this.categoryRepository.save({
      ...category,
      ...updateCategoryDto
    });

    return updated;
  }
}
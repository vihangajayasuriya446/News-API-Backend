import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CategoriesService } from '../services/categories.service';
import { CategoryResponseDto } from '../dto/category-response.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(): Promise<CategoryResponseDto[]> {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CategoryResponseDto> {
    return this.categoriesService.findOne(id);
  }
}
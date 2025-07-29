// src/categories/categories.module.ts (Example structure - modify based on your actual file)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './services/categories.service'; // Assuming this path
import { Category } from './entities/category.entity'; // Assuming this path
import { CategoriesController } from './controllers/categories.controller'; // Assuming this path

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]), // Make CategoryRepository available
  ],
  controllers: [CategoriesController], // If you have a controller
  providers: [CategoriesService], // Register the service as a provider
  exports: [CategoriesService, TypeOrmModule.forFeature([Category])], // Export the service and the TypeOrmModule for other modules to use
})
export class CategoriesModule {}
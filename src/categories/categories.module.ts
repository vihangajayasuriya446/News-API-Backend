import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './controllers/categories.controller';
import { CategoriesService } from './services/categories.service';
import { Category } from './entities/category.entity';
import { ArticlesModule } from '../articles/articles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    forwardRef(() => ArticlesModule),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
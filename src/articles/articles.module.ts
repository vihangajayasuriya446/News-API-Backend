import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesController } from './controllers/articles.controller';
import { ArticlesService } from './services/articles.service';
import { Article } from './entities/article.entity';
import { ArticleLike } from './entities/article-like.entity';
import { CategoriesModule } from '../categories/categories.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, ArticleLike]),
    forwardRef(() => CategoriesModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
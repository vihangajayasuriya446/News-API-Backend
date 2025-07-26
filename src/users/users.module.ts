import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { ArticlesModule } from '../articles/articles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => ArticlesModule),
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
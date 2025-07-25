import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { DuplicateKeyException } from '../shared/exceptions/duplicate-key.exception';
import { NotFoundException } from '../shared/exceptions/not-found.exception';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(user: Partial<User>): Promise<User> {
    try {
      const newUser = this.usersRepository.create(user);
      return await this.usersRepository.save(newUser);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new DuplicateKeyException('Email already exists');
      }
      throw error;
    }
  }
}
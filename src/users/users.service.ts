import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto): Promise<User | undefined> {
    return this.usersRepository.save(createUserDto);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findByEmailForAuth(
    email: string,
  ): Promise<{ id: number; email: string; password: string } | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password'],
    });
  }

  async findById(id: number) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async updateUser(id: number, updateData: UpdateProfileDto) {
    const hasUpdates = Object.keys(updateData).length > 0;

    if (!hasUpdates) {
      return this.findById(id);
    }

    const cleanUpdateData: Record<string, any> = {};

    for (const key in updateData) {
      if (updateData[key] !== undefined) {
        cleanUpdateData[key] = updateData[key] as string | number | null;
      }
    }

    if (Object.keys(cleanUpdateData).length === 0) {
      return this.findById(id);
    }

    await this.usersRepository.update(id, cleanUpdateData);
    return this.findById(id);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from './entities/file.entity';
import { CreateFileDto } from './dto/create-file.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private filesRepository: Repository<FileEntity>,
  ) {}

  async create(createFileDto: CreateFileDto, user: User): Promise<FileEntity> {
    const file = this.filesRepository.create({
      ...createFileDto,
      user,
      visibility: createFileDto.visibility || 'public',
    });
    return this.filesRepository.save(file);
  }

  async findByUser(userId: number): Promise<FileEntity[]> {
    return this.filesRepository.find({ where: { user: { id: userId } } });
  }

  async findOne(id: number) {
    return this.filesRepository.findOne({ where: { id }, relations: ['user'] });
  }
}

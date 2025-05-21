import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
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
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const file = this.filesRepository.create({
      ...createFileDto,
      user,
      visibility: createFileDto.visibility || 'public',
      expiresAt: expiryDate,
    });

    return this.filesRepository.save(file);
  }

  async markFileAsUsed(fileId: number): Promise<void> {
    await this.filesRepository.update(fileId, { expiresAt: null });
  }

  async findExpiredFiles(date: Date): Promise<FileEntity[]> {
    return this.filesRepository.find({
      where: {
        expiresAt: LessThan(date),
      },
    });
  }

  async deleteFileFromDisk(filename: string): Promise<void> {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join('./uploads', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async remove(id: number): Promise<void> {
    await this.filesRepository.delete(id);
  }

  async findOne(id: number) {
    return this.filesRepository.findOne({ where: { id }, relations: ['user'] });
  }
}

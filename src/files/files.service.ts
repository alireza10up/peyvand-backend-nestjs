import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { FileEntity } from './entities/file.entity';
import { CreateFileDto } from './dto/create-file.dto';
import { UserEntity } from '../users/entities/user.entity';
import { promises as fs } from 'fs';
import * as path from 'path';
import { FileVisibility } from './enums/file-visibility.enum';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly filesRepository: Repository<FileEntity>,
  ) {}

  async create(
    createFileDto: CreateFileDto,
    user: Partial<UserEntity>,
  ): Promise<FileEntity> {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + (createFileDto.expiresAt ?? 0));

    const file = this.filesRepository.create({
      ...createFileDto,
      user,
      visibility: createFileDto.visibility || FileVisibility.PUBLIC,
      expiresAt: expiryDate,
    });

    return this.filesRepository.save(file);
  }

  async markFileAsUsed(fileId: number): Promise<void> {
    await this.filesRepository.update(fileId, { expiresAt: null });
  }

  async markFilesAsUsed(fileIds: number[]): Promise<void> {
    if (!fileIds || fileIds.length === 0) return;

    await this.filesRepository.update({ id: In(fileIds) }, { expiresAt: null });
  }

  async findExpiredFiles(date: Date): Promise<FileEntity[]> {
    return this.filesRepository.find({
      where: {
        expiresAt: LessThan(date),
      },
    });
  }

  async deleteFileFromDisk(
    targetDirectory: string,
    filename: string,
  ): Promise<void> {
    const filePath = path.join(targetDirectory, filename);
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch (error) {
      console.error(error);
      console.warn(`فایل پیدا نشد یا قابل حذف نیست: ${filePath}`);
    }
  }

  async remove(id: number): Promise<void> {
    await this.filesRepository.delete(id);
  }

  async findOne(id: number) {
    return this.filesRepository.findOne({ where: { id }, relations: ['user'] });
  }

  async findOrFailed(id: number, visibility: FileVisibility) {
    const fileFounded: FileEntity | null = await this.filesRepository.findOne({
      where: { id, visibility },
      relations: ['user'],
    });

    if (!fileFounded) {
      throw new NotFoundException('فایل مدنظر پیدا نشد');
    }

    return fileFounded;
  }

  async isPublic(id: number): Promise<boolean> {
    const fileFounded: FileEntity | null = await this.filesRepository.findOne({
      where: { id, visibility: FileVisibility.PUBLIC },
      relations: ['user'],
    });

    return !!fileFounded;
  }

  async validatePublicFiles(fileIds: number[]): Promise<FileEntity[]> {
    if (!fileIds || fileIds.length === 0) {
      return [];
    }

    const files = await this.filesRepository.find({
      where: {
        id: In(fileIds),
        visibility: FileVisibility.PUBLIC,
      },
    });

    if (files.length !== fileIds.length) {
      throw new ConflictException('برخی فایل‌ها پابلیک نیستند یا وجود ندارند.');
    }

    return files;
  }

  async validatePrivateFilesOfUser(
    fileIds: number[],
    userId: number,
  ): Promise<FileEntity[]> {
    if (!fileIds || fileIds.length === 0) {
      return [];
    }

    const files = await this.filesRepository.find({
      where: {
        id: In(fileIds),
        visibility: FileVisibility.PRIVATE,
        user: { id: userId },
      },
    });

    if (files.length !== fileIds.length) {
      throw new ConflictException(
        'برخی فایل‌های خصوصی معتبر نیستند یا به شما تعلق ندارند.',
      );
    }
    return files;
  }
}

import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FilesService } from '../files/files.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly filesService: FilesService,
  ) {}

  create(createUserDto: CreateUserDto): Promise<UserEntity | undefined> {
    return this.usersRepository.save(createUserDto);
  }

  findByEmail(email: string): Promise<UserEntity | null> {
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

    // Check Field student_code Uniques
    if (updateData.studentCode != undefined) {
      const existingUser = await this.usersRepository.findOne({
        where: { studentCode: updateData.studentCode },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('کد دانشجویی تکراری است');
      }
    }

    // Check Field File Exist and Public
    if (updateData.profileFile != undefined) {
      const isFilePublic: boolean = await this.filesService.isPublic(
        updateData.profileFile,
      );

      if (!isFilePublic) {
        throw new ConflictException('فایل پروفایل شما غیر مجاز است');
      }

      // Mark File To Used
      await this.filesService.markFileAsUsed(updateData.profileFile);
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

    await this.usersRepository.update(id, {
      ...cleanUpdateData,
      profileFile: cleanUpdateData.profileFile
        ? { id: updateData.profileFile }
        : null,
    });

    return this.findById(id);
  }
}

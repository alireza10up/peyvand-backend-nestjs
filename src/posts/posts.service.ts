import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { PostEntity } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UserEntity } from '../users/entities/user.entity';
import { FileEntity } from '../files/entities/file.entity';
import { FilesService } from 'src/files/files.service';
import { PostStatus } from './post-status.enum';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    private readonly filesService: FilesService,
  ) {}

  async create(
    createPostDto: CreatePostDto,
    user: Partial<UserEntity>,
  ): Promise<PostEntity> {
    let files: FileEntity[] = [];

    if (createPostDto.file_ids && createPostDto.file_ids.length > 0) {
      if (createPostDto.file_ids.length > 10) {
        throw new ConflictException('بیشتر از 10 فایل ارسال شده است.');
      }

      files = await this.filesService.validatePublicFiles(
        createPostDto.file_ids,
      );

      await this.filesService.markFilesAsUsed(createPostDto.file_ids);
    }

    const post = this.postsRepository.create({
      ...createPostDto,
      user,
      files,
    });

    return this.postsRepository.save(post);
  }

  findAll(): Promise<PostEntity[]> {
    return this.postsRepository.find({
      where: { status: PostStatus.PUBLISHED },
      relations: ['user', 'files'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<PostEntity> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['user', 'files'],
    });

    if (!post) {
      throw new NotFoundException('پست یافت نشد');
    }

    return post;
  }

  async update(
    id: number,
    updatePostDto: UpdatePostDto,
  ): Promise<PostEntity | null> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['user', 'files'],
    });

    if (!post) {
      throw new NotFoundException('پست یافت نشد');
    }

    await this.postsRepository.update(id, updatePostDto);

    return this.findOne(id);
  }

  async remove(id: number): Promise<boolean> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['user', 'files'],
    });

    if (!post) {
      throw new NotFoundException('پست یافت نشد');
    }

    const deleteResult: DeleteResult = await this.postsRepository.delete(id);

    return !!((deleteResult.affected ?? 0) > 0);
  }
}

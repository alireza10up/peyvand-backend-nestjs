import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UserEntity } from '../users/entities/user.entity';
import { FileEntity } from '../files/entities/file.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private postsRepository: Repository<PostEntity>,
    @InjectRepository(FileEntity)
    private filesRepository: Repository<FileEntity>,
  ) {}

  async create(
    createPostDto: CreatePostDto,
    user: UserEntity,
  ): Promise<PostEntity> {
    const files: FileEntity[] = [];

    if (createPostDto.fileIds && createPostDto.fileIds.length > 0) {
      const foundFile = await this.filesRepository.findOne({
        where: { id: createPostDto.fileIds[0] },
      });
      if (foundFile) files.push(foundFile);
    }

    const post = this.postsRepository.create({
      ...createPostDto,
      user,
      files,
    });

    return this.postsRepository.save(post);
  }

  findAll(): Promise<PostEntity[]> {
    return this.postsRepository.find({ relations: ['author', 'file'] });
  }

  async findOne(id: number): Promise<PostEntity> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author', 'file'],
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async update(
    id: number,
    updatePostDto: UpdatePostDto,
    user: UserEntity,
  ): Promise<PostEntity> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author', 'file'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    let file = post.files;

    if (updatePostDto.fileIds && updatePostDto.fileIds.length > 0) {
      const foundFile = await this.filesRepository.findOne({
        where: { id: updatePostDto.fileIds[0] },
      });
      if (foundFile) {
        file = foundFile;
      }
    }
    Object.assign(post, updatePostDto, { file });
    return this.postsRepository.save(post);
  }

  async remove(id: number, user: UserEntity): Promise<void> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author', 'file'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.postsRepository.delete(id);
  }
}

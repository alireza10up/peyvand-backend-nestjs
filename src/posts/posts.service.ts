import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from '../users/entities/user.entity';
import { FileEntity } from '../files/entities/file.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(FileEntity)
    private filesRepository: Repository<FileEntity>,
  ) {}

  async create(createPostDto: CreatePostDto, author: User): Promise<Post> {
    let file: FileEntity | undefined = undefined;
    if (createPostDto.fileIds && createPostDto.fileIds.length > 0) {
      const foundFile = await this.filesRepository.findOne({ where: { id: createPostDto.fileIds[0] } });
      if (foundFile) file = foundFile;
    }
    const post = this.postsRepository.create({ ...createPostDto, author, file });
    return this.postsRepository.save(post);
  }

  findAll(): Promise<Post[]> {
    return this.postsRepository.find({ relations: ['author', 'file'] });
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id }, relations: ['author', 'file'] });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto, user: User): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id }, relations: ['author', 'file'] });
    if (!post) throw new NotFoundException('Post not found');
    let file = post.file;
    if (updatePostDto.fileIds && updatePostDto.fileIds.length > 0) {
      const foundFile = await this.filesRepository.findOne({ where: { id: updatePostDto.fileIds[0] } });
      if (foundFile) file = foundFile;
    }
    Object.assign(post, updatePostDto, { file });
    return this.postsRepository.save(post);
  }

  async remove(id: number, user: User): Promise<void> {
    const post = await this.postsRepository.findOne({ where: { id }, relations: ['author', 'file'] });
    if (!post) throw new NotFoundException('Post not found');
    await this.postsRepository.delete(id);
  }
}

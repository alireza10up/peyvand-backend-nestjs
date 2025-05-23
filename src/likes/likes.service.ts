import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LikeEntity } from './entities/like.entity';
import { UserEntity } from '../users/entities/user.entity';
import { PostEntity } from '../posts/entities/post.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(LikeEntity)
    private readonly likeRepository: Repository<LikeEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
  ) {}

  async likePost(userId: number, postId: number): Promise<LikeEntity> {
    const post = await this.postRepository.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('پست یافت نشد');
    }

    const existing = await this.likeRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });

    if (existing) {
      throw new ConflictException('قبلاً لایک کرده‌اید');
    }

    const like = this.likeRepository.create({
      user: { id: userId } as UserEntity,
      post: { id: postId } as PostEntity,
    });

    return this.likeRepository.save(like);
  }

  async unlikePost(userId: number, postId: number): Promise<void> {
    const like = await this.likeRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });

    if (!like) {
      throw new NotFoundException('لایک پیدا نشد');
    }

    await this.likeRepository.delete(like.id);
  }

  async countLikes(postId: number): Promise<number> {
    return this.likeRepository.count({ where: { post: { id: postId } } });
  }

  async hasUserLiked(userId: number, postId: number): Promise<boolean> {
    const like = await this.likeRepository.findOne({
      where: {
        user: { id: userId },
        post: { id: postId },
      },
    });

    return !!like;
  }
}

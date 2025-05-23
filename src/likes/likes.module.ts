import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikeEntity } from './entities/like.entity';
import { LikesService } from './likes.service';
import { PostEntity } from '../posts/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LikeEntity, PostEntity])],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}

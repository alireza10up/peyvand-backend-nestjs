import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { FileEntity } from '../files/entities/file.entity';
import { Post } from './entities/post.entity';
import { FilesService } from '../files/files.service';
import { PostVisibilityGuard } from './guards/post-visibility.guard';
import { PostOwnerGuard } from './guards/post-owner.guard';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity, Post])],
  controllers: [PostsController],
  providers: [PostsService, PostVisibilityGuard, PostOwnerGuard, FilesService],
})
export class PostsModule {}

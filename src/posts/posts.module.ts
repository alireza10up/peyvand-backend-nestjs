import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from './posts.entity';
import { ScaculePostGuard } from './scacule-post.guard';
import { FileEntity } from '../files/entities/file.entity';
import { FilesService } from '../files/files.service';
import { PostVisibilityGuard } from './guards/post-visibility.guard';
import { PostOwnerGuard } from './guards/post-owner.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Post, FileEntity])],
  controllers: [PostsController],
  providers: [PostsService, ScaculePostGuard, PostVisibilityGuard, PostOwnerGuard, FilesService],
})
export class PostsModule {}

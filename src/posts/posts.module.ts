import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PostEntity } from './entities/post.entity';
import { PostVisibilityGuard } from './guards/post-visibility.guard';
import { PostOwnerGuard } from './guards/post-owner.guard';
import { FilesModule } from '../files/files.module';
import { LikesModule } from '../likes/likes.module';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity]), FilesModule, LikesModule],
  controllers: [PostsController],
  providers: [PostsService, PostVisibilityGuard, PostOwnerGuard],
})
export class PostsModule {}

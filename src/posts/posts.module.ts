import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PostEntity } from './entities/post.entity';
import { FilesService } from '../files/files.service';
import { PostVisibilityGuard } from './guards/post-visibility.guard';
import { PostOwnerGuard } from './guards/post-owner.guard';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity]), FilesModule],
  controllers: [PostsController],
  providers: [PostsService, PostVisibilityGuard, PostOwnerGuard],
})
export class PostsModule {}

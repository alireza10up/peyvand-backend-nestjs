import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ConnectionsModule } from '../connections/connections.module';
import { UsersModule } from '../users/users.module';
import { PostsModule } from '../posts/posts.module';
import { CommentsModule } from '../comments/comments.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    ConnectionsModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    FilesModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

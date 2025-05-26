import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { PostsModule } from './posts/posts.module';
import { FilesModule } from './files/files.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConnectionsModule } from './connections/connections.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CommonModule,
    PostsModule,
    FilesModule,
    ConnectionsModule,
  ],
  providers: [],
})
export class AppModule {}

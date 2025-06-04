import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { PostsModule } from './posts/posts.module';
import { FilesModule } from './files/files.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConnectionsModule } from './connections/connections.module';
import { CommentsModule } from './comments/comments.module';
import { ChatModule } from './chat/chat.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AdminModule } from './admin/admin.module';
import { UniversitiesModule } from './universities/universities.module';

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
    CommentsModule,
    ChatModule,
    AdminModule,
    UniversitiesModule,
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uploadPath = configService.get<string>(
          'UPLOAD_DESTINATION',
          'uploads',
        );
        const adminPath = configService.get<string>(
          'ADMIN_PANEL',
          'admin',
        );

        const rootPathUpload = join(process.cwd(), uploadPath);
        const rootPathAdmin = join(process.cwd(), 'public/admin');

        return [
          {
            rootPath: rootPathUpload,
            serveRoot: `/${uploadPath}`,
            serveStaticOptions: {},
          },
          {
            rootPath: rootPathAdmin,
            serveRoot: `/${adminPath}`,
            serveStaticOptions: {},
          },
        ];
      },
    }),
  ],
  providers: [],
})
export class AppModule {}

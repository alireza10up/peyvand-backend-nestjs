import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ConversationParticipantGuard } from './guards/conversation-participant.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity } from './entities/conversation.entity';
import { MessageEntity } from './entities/message.entity';
import { FilesModule } from '../files/files.module';
import { UsersModule } from '../users/users.module';
import { ConfigModule } from '@nestjs/config';
import { ChatGateway } from './gateways/chat.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationEntity, MessageEntity]),
    UsersModule,
    FilesModule,
    ConfigModule,
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ConversationParticipantGuard],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}

import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ConversationParticipantGuard } from './guards/conversation-participant.guard';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ConversationParticipantGuard],
})
export class ChatModule {}

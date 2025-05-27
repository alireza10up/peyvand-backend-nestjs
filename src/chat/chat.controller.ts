import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { ConversationDto } from './dto/conversation.dto';
import { MessageDto } from './dto/message.dto';
import { UserEntity } from '../users/entities/user.entity';
import { ConversationParticipantGuard } from './guards/conversation-participant.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  async createOrGetConversation(
    @Request() req: RequestWithUser,
    @Body() createConversationDto: CreateConversationDto,
  ): Promise<ConversationDto> {
    const currentUser = { id: req.user.id } as UserEntity;
    return this.chatService.createOrGetConversation(
      currentUser,
      createConversationDto,
    );
  }

  @Get('conversations')
  async getUserConversations(
    @Request() req: RequestWithUser,
  ): Promise<ConversationDto[]> {
    return this.chatService.getUserConversations(req.user.id);
  }

  @Post('messages')
  @UseGuards(ConversationParticipantGuard)
  async createMessage(
    @Request() req: RequestWithUser,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<MessageDto> {
    const sender = { id: req.user.id, email: req.user.email } as UserEntity;
    return this.chatService.createMessage(sender, createMessageDto);
  }

  @Get('conversations/:conversationId/messages')
  @UseGuards(ConversationParticipantGuard)
  async getMessagesForConversation(
    @Request() req: RequestWithUser,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    // @Query('page', new ParseIntPipe({ optional: true, defaultValue: 1 })) page: number, // TODO
    // @Query('limit', new ParseIntPipe({ optional: true, defaultValue: 20 })) limit: number, // TODO
  ): Promise<MessageDto[]> {
    return this.chatService.getMessagesForConversation(
      req.user.id,
      conversationId,
    );
  }

  @Post('conversations/:conversationId/messages/read')
  @UseGuards(ConversationParticipantGuard)
  async markMessagesAsRead(
    @Request() req: RequestWithUser,
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ): Promise<{ message: string }> {
    await this.chatService.markMessagesAsRead(conversationId, req.user.id);
    return { message: 'پیام‌ها با موفقیت خوانده شدند.' };
  }
}

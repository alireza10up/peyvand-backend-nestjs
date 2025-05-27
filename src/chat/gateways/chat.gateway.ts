import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { ChatService } from '../chat.service';
import { MessageDto } from '../dto/message.dto';
import { UsersService } from '../../users/users.service';
import { AuthenticatedSocket } from '../intefaces/authenticated-socket.interface';
import { MessageStatus } from '../enums/message-status.enum';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');

  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(
          `Client ${client.id} - No token provided, disconnecting.`,
        );
        client.disconnect(true);
        return;
      }

      const jwtSecret = this.configService.get<string>('JWT_SECRET', 'peyvand');
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtSecret,
      });
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        this.logger.warn(
          `Client ${client.id} - User not found for token, disconnecting.`,
        );
        client.disconnect(true);
        return;
      }

      client.user = user;
      this.logger.log(
        `Client authenticated and connected: ${user.email} (Socket ID: ${client.id})`,
      );
      client.join(user.id.toString());
    } catch (error) {
      this.logger.error(
        `Authentication failed for client ${client.id}: ${error instanceof Error ? error.message : error}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      this.logger.log(
        `Client disconnected: ${client.user.email} (Socket ID: ${client.id})`,
      );
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<{ status: string; message?: string }> {
    if (!client.user)
      return { status: 'error', message: 'کاربر احراز هویت نشده است.' };

    const { conversationId } = data;
    const userId = client.user.id;

    try {
      const conversation =
        await this.chatService.getConversionById(conversationId);
      if (
        !conversation ||
        !conversation.participants.some((p) => p.id === userId)
      ) {
        return { status: 'error', message: 'شما عضو این گفتگو نیستید.' };
      }

      client.join(conversationId.toString());
      this.logger.log(
        `User ${client.user.email} joined conversation room: ${conversationId}`,
      );

      await this.chatService.markMessagesAsRead(conversationId, userId);
      this.emitMessageStatusUpdateToConversation(
        conversationId,
        userId,
        MessageStatus.READ,
      );

      return { status: 'ok', message: `Joined conversation ${conversationId}` };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error joining conversation ${conversationId} for user ${userId}: ${errorMessage}`,
      );
      return { status: 'error', message: 'خطا در پیوستن به گفتگو.' };
    }
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): void {
    if (client.user) {
      client.leave(data.conversationId.toString());
      this.logger.log(
        `User ${client.user.email} left conversation room: ${data.conversationId}`,
      );
    }
  }

  @SubscribeMessage('startTyping')
  handleStartTyping(
    @MessageBody() data: { conversationId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): void {
    if (!client.user) return;
    const { conversationId } = data;
    client.to(conversationId.toString()).emit('userTyping', {
      conversationId,
      userId: client.user.id,
      userName: client.user.firstName || client.user.email,
    });
    this.logger.log(
      `User ${client.user.email} started typing in conversation: ${conversationId}`,
    );
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @MessageBody() data: { conversationId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): void {
    if (!client.user) return;
    const { conversationId } = data;
    client.to(conversationId.toString()).emit('userStoppedTyping', {
      conversationId,
      userId: client.user.id,
    });
    this.logger.log(
      `User ${client.user.email} stopped typing in conversation: ${conversationId}`,
    );
  }

  public sendNewMessageToConversation(
    conversationId: number,
    message: MessageDto,
  ) {
    this.server.to(conversationId.toString()).emit('newMessage', message);
    this.logger.log(`Message sent to conversation room: ${conversationId}`);
  }

  public emitMessageStatusUpdateToConversation(
    conversationId: number,
    readerId: number,
    status: MessageStatus,
  ) {
    const payload = { conversationId, readerId, status };
    this.server
      .to(conversationId.toString())
      .emit('messageStatusUpdated', payload);
    this.logger.log(
      `Message status updated in room ${conversationId} by user ${readerId} to ${status}`,
    );
  }
}

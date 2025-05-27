import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatService } from '../chat.service';
import { ConversationEntity } from '../entities/conversation.entity';

@Injectable()
export class ConversationParticipantGuard implements CanActivate {
  constructor(private readonly chatService: ChatService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const conversationIdParam = request.params.conversationId;

    let conversationId: number;

    if (conversationIdParam) {
      conversationId = parseInt(conversationIdParam, 10);
    } else {
      return true;
    }

    if (isNaN(conversationId)) {
      throw new ForbiddenException('شناسه گفتگو نامعتبر است.');
    }

    try {
      const conversation: ConversationEntity | null =
        await this.chatService.getConversionById(conversationId);

      if (!conversation) {
        throw new NotFoundException('گفتگو یافت نشد.');
      }

      const isParticipant = conversation.participants.some(
        (participant) => participant.id === user.id,
      );

      if (!isParticipant) {
        throw new ForbiddenException('شما عضو این گفتگو نیستید.');
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new ForbiddenException('شما مجاز به دسترسی به این گفتگو نیستید.');
    }
  }
}

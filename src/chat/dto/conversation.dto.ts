import { UserProfileDto } from '../../users/dto/user-profile.dto';
import { MessageDto } from './message.dto';

export class ConversationDto {
  id: number;
  participants: UserProfileDto[];
  lastMessage?: MessageDto;
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

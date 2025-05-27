import { UserProfileDto } from '../../users/dto/user-profile.dto';
import { FileEntity } from '../../files/entities/file.entity';
import { MessageStatus } from '../enums/message-status.enum';

export class MessageDto {
  id: number;
  content?: string;
  sender: UserProfileDto;
  conversationId: number;
  attachments?: Partial<FileEntity>[];
  status: MessageStatus;
  createdAt: Date;
  updatedAt: Date;
}

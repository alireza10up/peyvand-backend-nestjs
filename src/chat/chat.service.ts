import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ConversationEntity } from './entities/conversation.entity';
import { MessageEntity } from './entities/message.entity';
import { UserEntity } from '../users/entities/user.entity';
import { FilesService } from '../files/files.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { ConversationDto } from './dto/conversation.dto';
import { MessageDto } from './dto/message.dto';
import { UsersService } from '../users/users.service';
import { plainToInstance } from 'class-transformer';
import { UserProfileDto } from '../users/dto/user-profile.dto';
import { FileEntity } from '../files/entities/file.entity';
import { MessageStatus } from './enums/message-status.enum';
import { FileVisibility } from '../files/enums/file-visibility.enum';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
  ) {}

  async createOrGetConversation(
    currentUser: UserEntity,
    createConversationDto: CreateConversationDto,
  ): Promise<ConversationDto> {
    const { participantId } = createConversationDto;

    if (currentUser.id === participantId) {
      throw new BadRequestException('امکان ایجاد گفتگو با خودتان وجود ندارد.');
    }

    const otherParticipant = await this.usersService.findById(participantId);
    if (!otherParticipant) {
      throw new NotFoundException('کاربر مقابل یافت نشد.');
    }

    let conversation = await this.conversationRepository
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'participant1_alias')
      .innerJoin('conversation.participants', 'participant2_alias')
      .where(
        'participant1_alias.id = :currentUserId AND participant2_alias.id = :otherParticipantId',
        {
          currentUserId: currentUser.id,
          otherParticipantId: participantId,
        },
      )
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('COUNT(cp.user_id)')
          .from('conversation_participants', 'cp')
          .where('cp.conversation_id = conversation.id')
          .getQuery();
        return `(${subQuery}) = 2`;
      })
      .leftJoinAndSelect('conversation.participants', 'loaded_participants')
      .getOne();

    if (!conversation) {
      const newConversation = this.conversationRepository.create({
        participants: [currentUser, otherParticipant],
      });
      //  باید participants رو هم همراهش برگردونیم برای mapConversationToDto
      const savedConv = await this.conversationRepository.save(newConversation);
      //  بعد از save، participants لود نمیشن مگر اینکه دوباره find کنیم یا eager باشه (که هست)
      conversation = await this.conversationRepository.findOne({
        where: { id: savedConv.id },
        relations: ['participants'], //  اطمینان از لود شدن participants
      });
      if (!conversation) {
        //  این نباید اتفاق بیوفته
        throw new NotFoundException('خطا در ایجاد یا بازیابی گفتگو.');
      }
    }

    return this.mapConversationToDto(conversation, currentUser.id);
  }

  async createMessage(
    sender: UserEntity,
    createMessageDto: CreateMessageDto,
  ): Promise<MessageDto> {
    const { conversationId, content, attachmentFileIds } = createMessageDto;

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('گفتگو یافت نشد.');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.id === sender.id,
    );

    if (!isParticipant) {
      throw new UnauthorizedException(
        'شما مجاز به ارسال پیام در این گفتگو نیستید.',
      );
    }

    if (!content && (!attachmentFileIds || attachmentFileIds.length === 0)) {
      throw new BadRequestException(
        'پیام نمی‌تواند خالی باشد (متن یا فایل الزامی است).',
      );
    }

    if (attachmentFileIds && attachmentFileIds.length > 0) {
      await this.filesService.validatePrivateFilesOfUser(
        attachmentFileIds,
        sender.id,
      );
      await this.filesService.markFilesAsUsed(attachmentFileIds);
    }

    const newMessage = this.messageRepository.create({
      content,
      sender,
      conversation,
      attachment_file_ids: attachmentFileIds,
      status: MessageStatus.SENT,
    });

    const savedMessage = await this.messageRepository.save(newMessage);

    return this.mapMessageToDto(savedMessage, sender.id);
  }

  async getUserConversations(userId: number): Promise<ConversationDto[]> {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participant_user')
      .leftJoin(
        'conversation_participants',
        'cp',
        'cp.conversation_id = conversation.id',
      )
      .where('cp.user_id = :userId', { userId })
      .orderBy('conversation.updatedAt', 'DESC')
      .getMany();

    return Promise.all(
      conversations.map((conv) =>
        this.mapConversationToDto(conv, userId, true),
      ),
    );
  }

  async getMessagesForConversation(
    userId: number,
    conversationId: number,
  ): Promise<MessageDto[]> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('گفتگو یافت نشد.');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.id === userId,
    );
    if (!isParticipant) {
      throw new UnauthorizedException('شما مجاز به مشاهده این گفتگو نیستید.');
    }

    const messages = await this.messageRepository.find({
      where: { conversation: { id: conversationId } },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });

    await this.markMessagesAsRead(conversationId, userId);

    return Promise.all(
      messages.map((msg) => this.mapMessageToDto(msg, userId)),
    );
  }

  async markMessagesAsRead(
    conversationId: number,
    readerId: number,
  ): Promise<void> {
    await this.messageRepository.update(
      {
        conversation: { id: conversationId },
        sender: { id: Not(readerId) },
        status: MessageStatus.SENT,
      },
      { status: MessageStatus.READ },
    );
  }

  async getConversionById(
    conversationId: number,
  ): Promise<ConversationEntity | null> {
    return await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });
  }

  // --- Helper Mappers ---
  private async mapConversationToDto(
    conversation: ConversationEntity,
    currentUserId: number,
    includeLastMessage: boolean = true,
  ): Promise<ConversationDto> {
    const participantsDto = conversation.participants.map((p) =>
      plainToInstance(UserProfileDto, p),
    );

    let lastMessageDto: MessageDto | undefined = undefined;
    if (includeLastMessage) {
      const lastMessage = await this.messageRepository.findOne({
        where: { conversation: { id: conversation.id } },
        order: { createdAt: 'DESC' },
        relations: ['sender'],
      });
      if (lastMessage) {
        lastMessageDto = await this.mapMessageToDto(lastMessage, currentUserId);
      }
    }

    const unreadCount = await this.messageRepository.count({
      where: {
        conversation: { id: conversation.id },
        sender: { id: Not(currentUserId) },
        status: MessageStatus.SENT,
      },
    });

    return {
      id: conversation.id,
      participants: participantsDto,
      lastMessage: lastMessageDto,
      unreadCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private async mapMessageToDto(
    message: MessageEntity,
    currentUserId: number,
  ): Promise<MessageDto> {
    let attachmentsDto: Partial<FileEntity>[] | undefined = undefined;

    console.info(currentUserId);

    if (message.attachment_file_ids && message.attachment_file_ids.length > 0) {
      const files: FileEntity[] = [];

      for (const fileId of message.attachment_file_ids) {
        try {
          const file = await this.filesService.findOrFailed(
            fileId,
            FileVisibility.PRIVATE,
          );

          if (file) {
            files.push(file);
          }
        } catch (error) {
          console.error(error);
          console.warn(
            `فایل با شناسه ${fileId} برای پیام ${message.id} یافت نشد یا دسترسی مجاز نیست.`,
          );
        }
      }
      attachmentsDto = files.map((f) => ({
        id: f.id,
        url: `/files/private/${f.id}`,
        filename: f.filename,
        mimetype: f.mimetype,
      }));
    }

    return {
      id: message.id,
      content: message.content,
      sender: plainToInstance(UserProfileDto, message.sender, {
        excludeExtraneousValues: true,
      }),
      conversationId: message.conversationId,
      attachments: attachmentsDto,
      status: message.status,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}

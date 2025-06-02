import {
  BadRequestException,
  forwardRef,
  Inject,
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
import { UserProfileDto } from '../users/dto/user-profile.dto'; // مطمئن شو این DTO شامل اطلاعات فایل پروفایل هست
import { FileEntity } from '../files/entities/file.entity';
import { MessageStatus } from './enums/message-status.enum';
import { FileVisibility } from '../files/enums/file-visibility.enum';
import { ChatGateway } from './gateways/chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
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
      .leftJoinAndSelect('conversation.participants', 'loaded_participants')
      .leftJoinAndSelect(
        'loaded_participants.profileFile',
        'profile_file_of_participant',
      )
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
      .getOne();

    if (!conversation) {
      const newConversation = this.conversationRepository.create({
        participants: [currentUser, otherParticipant],
      });

      const savedConv = await this.conversationRepository.save(newConversation);

      conversation = await this.conversationRepository.findOne({
        where: { id: savedConv.id },
        relations: ['participants', 'participants.profileFile'],
      });

      if (!conversation) {
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
      // TODO security check
      // await this.filesService.validatePrivateFilesOfUser(
      //   attachmentFileIds,
      //   sender.id,
      // );
      await this.filesService.validatePublicFiles(attachmentFileIds);
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
    const messageDto = await this.mapMessageToDto(savedMessage, sender.id);

    this.chatGateway.sendNewMessageToConversation(conversation.id, messageDto);

    conversation.updatedAt = new Date();
    await this.conversationRepository.save(conversation);

    return messageDto;
  }

  async getUserConversations(userId: number): Promise<ConversationDto[]> {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      // اول شرکت‌کننده‌ها رو با اطلاعات کاملشون (شامل فایل پروفایل) انتخاب می‌کنیم
      .leftJoinAndSelect('conversation.participants', 'participant_user')
      .leftJoinAndSelect(
        'participant_user.profileFile',
        'profile_file_of_participant',
      ) // <--- **مهم: اضافه کردن این خط**
      // بعد برای فیلتر کردن مکالمات کاربر فعلی، از جدول واسط conversation_participants استفاده می‌کنیم
      .innerJoin(
        // تغییر به innerJoin برای اطمینان از وجود کاربر در مکالمه
        'conversation_participants',
        'cp',
        'cp.conversation_id = conversation.id AND cp.user_id = :userId', // شرط رو مستقیم اینجا میاریم
        { userId },
      )
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
      relations: ['sender', 'sender.profileFile'],
      order: { createdAt: 'ASC' },
    });

    const unreadMessagesExist = messages.some(
      (m) => m.senderId !== userId && m.status === MessageStatus.SENT,
    );

    if (unreadMessagesExist) {
      await this.markMessagesAsRead(conversationId, userId);
      // Gateway call for status update will happen inside markMessagesAsRead
    }

    return Promise.all(
      messages.map((msg) => this.mapMessageToDto(msg, userId)),
    );
  }

  async markMessagesAsRead(
    conversationId: number,
    readerId: number,
  ): Promise<void> {
    const updateResult = await this.messageRepository.update(
      {
        conversation: { id: conversationId },
        sender: { id: Not(readerId) },
        status: MessageStatus.SENT,
      },
      { status: MessageStatus.READ },
    );

    if (updateResult.affected && updateResult.affected > 0) {
      this.chatGateway.emitMessageStatusUpdateToConversation(
        conversationId,
        readerId,
        MessageStatus.READ,
      );
    }
  }

  async getConversionById(
    conversationId: number,
  ): Promise<ConversationEntity | null> {
    return await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants', 'participants.profileFile'],
    });
  }

  private async mapConversationToDto(
    conversation: ConversationEntity,
    currentUserId: number,
    includeLastMessage: boolean = true,
  ): Promise<ConversationDto> {
    const participantsDto = conversation.participants.map((p) => {
      return plainToInstance(UserProfileDto, p);
    });

    let lastMessageDto: MessageDto | undefined = undefined;
    if (includeLastMessage) {
      const lastMessage = await this.messageRepository.findOne({
        where: { conversation: { id: conversation.id } },
        order: { createdAt: 'DESC' },
        relations: ['sender', 'sender.profileFile'],
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

    if (message.attachment_file_ids && message.attachment_file_ids.length > 0) {
      const files: FileEntity[] = [];
      for (const fileId of message.attachment_file_ids) {
        try {
          const file = await this.filesService.findOrFailed(
            fileId,
            // TODO security
            FileVisibility.PUBLIC,
          );
          if (file) {
            files.push(file);
          }
        } catch (error) {
          console.error(
            `Error fetching attachment file ${fileId} for message ${message.id}:`,
            error,
          );
        }
      }
      attachmentsDto = files.map((f) => ({
        id: f.id,
        url: f.url,
        filename: f.filename,
        mimetype: f.mimetype,
      }));
    }

    const senderDto = plainToInstance(UserProfileDto, message.sender);

    return {
      id: message.id,
      content: message.content,
      sender: senderDto,
      conversationId: message.conversationId,
      attachments: attachmentsDto,
      status: message.status,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}

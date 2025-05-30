import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConnectionEntity } from './entities/connection.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ConnectionStatus } from './enums/connection-status.enum';
import { UsersService } from '../users/users.service';
import { ConnectionDto } from './dto/connection.dto';
import { UserSummaryDto } from '../users/dto/user-summary.dto';
import { ConnectionStatusWithUserDto } from './dto/connection-status-with-user.dto';
import { CreateConnectionRequestDto } from './dto/create-connection-request.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(ConnectionEntity)
    private readonly connectionRepository: Repository<ConnectionEntity>,
    private readonly usersService: UsersService,
  ) {}

  // --- Helper Methods ---

  private async findUserOrFail(userId: number): Promise<UserEntity> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`کاربر با شناسه ${userId} یافت نشد.`);
    }
    return user;
  }

  async findConnectionBetweenUsers(
    userId1: number,
    userId2: number,
  ): Promise<ConnectionEntity | null> {
    return this.connectionRepository.findOne({
      where: [
        { requesterId: userId1, receiverId: userId2 },
        { requesterId: userId2, receiverId: userId1 },
      ],
      relations: [
        'requester',
        'receiver',
        'requester.profileFile',
        'receiver.profileFile',
      ],
    });
  }

  private mapUserToUserSummaryDto(user: UserEntity): UserSummaryDto | null {
    if (!user) {
      return null;
    }

    return plainToInstance(UserSummaryDto, user);
  }

  private mapConnectionToDto(
    connection: ConnectionEntity,
    currentUserId: number,
  ): ConnectionDto {
    const dto: ConnectionDto = new ConnectionDto();
    dto.id = connection.id;
    dto.status = connection.status;
    dto.createdAt = connection.createdAt;
    dto.updatedAt = connection.updatedAt;

    if (connection.requesterId === currentUserId) {
      dto.user = this.mapUserToUserSummaryDto(connection.receiver);
    } else if (connection.receiverId === currentUserId) {
      dto.user = this.mapUserToUserSummaryDto(connection.requester);
    } else {
      // This case might occur if an admin is viewing or for a generic "other user" context
      // For now, assuming context implies currentUserId is one of the participants
      // Or if the connection doesn't involve the current user directly but is fetched for other reasons
      // Defaulting to showing receiver if currentUserId isn't involved (should be rare in user-centric views)
      // This part might need adjustment based on specific use cases for viewing connections not directly involving the logged-in user.
      // For most user-facing endpoints, the queries should ensure currentUserId is a participant.
      throw new InternalServerErrorException(
        'خطا در نگاشت کاربر در ConnectionDto',
      );
    }

    return dto;
  }

  private mapConnectionsToDtoArray(
    connections: ConnectionEntity[],
    currentUserId: number,
  ): ConnectionDto[] {
    return connections.map((conn) =>
      this.mapConnectionToDto(conn, currentUserId),
    );
  }

  async findConnectionByIdOrFail(
    connectionId: number,
    relations: string[] = [], // Default to no relations if not specified
  ): Promise<ConnectionEntity> {
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId },
      relations:
        relations.length > 0
          ? relations
          : [
              'requester',
              'receiver',
              'requester.profileFile',
              'receiver.profileFile',
            ], // Load default relations if none specified for general use
    });
    if (!connection) {
      throw new NotFoundException(`ارتباط با شناسه ${connectionId} یافت نشد.`);
    }
    return connection;
  }

  // --- Core Methods ---

  async sendRequest(
    requesterId: number,
    createDto: CreateConnectionRequestDto,
  ): Promise<ConnectionDto> {
    if (requesterId === createDto.receiverId) {
      throw new ConflictException(
        'نمی‌توانید به خودتان درخواست ارتباط ارسال کنید.',
      );
    }

    const requester = await this.findUserOrFail(requesterId);
    const receiver = await this.findUserOrFail(createDto.receiverId);

    const existingConnection = await this.findConnectionBetweenUsers(
      requesterId,
      createDto.receiverId,
    );

    if (existingConnection) {
      if (existingConnection.status === ConnectionStatus.PENDING) {
        throw new ConflictException(
          'یک درخواست در انتظار قبلاً با این کاربر وجود دارد.',
        );
      }

      if (existingConnection.status === ConnectionStatus.ACCEPTED) {
        throw new ConflictException(
          'شما قبلاً با این کاربر ارتباط برقرار کرده‌اید.',
        );
      }

      if (existingConnection.status === ConnectionStatus.BLOCKED) {
        // Check who blocked whom
        if (
          (existingConnection.requesterId === requesterId &&
            existingConnection.status === ConnectionStatus.BLOCKED) || // You blocked them
          (existingConnection.receiverId === requesterId &&
            existingConnection.status === ConnectionStatus.BLOCKED) // They blocked you (assuming BLOCKED is mutual or initiated by one party)
        ) {
          throw new ConflictException(
            'به دلیل مسدود بودن، امکان ارسال درخواست وجود ندارد.',
          );
        }
      }
      // If REJECTED, allow sending a new request by creating a new one or updating the existing one.
      // For simplicity, let's assume we delete the old rejected request and create a new pending one,
      // or update its status to PENDING and swap requester/receiver if needed.
      // Current unique index might prevent this if not handled carefully.
      // Let's update the existing one if it was REJECTED by the current receiver.
      if (existingConnection.status === ConnectionStatus.REJECTED) {
        // If the current requester was the previous receiver of a rejected request,
        // or if the current requester was the previous requester of a rejected request,
        // we can potentially "resend" by updating the status.
        // For now, let's assume a new request means creating a new record if the old one was REJECTED.
        // This depends on business logic: can a rejected request be "re-sent" or is it a new interaction?
        // The unique index on (requesterId, receiverId) means we can't just create a new one
        // if the pair already exists, regardless of status.
        // So we must update the existing one.
        if (
          (existingConnection.requesterId === requesterId &&
            existingConnection.receiverId === createDto.receiverId) ||
          (existingConnection.requesterId === createDto.receiverId &&
            existingConnection.receiverId === requesterId)
        ) {
          // If a rejected request exists, update it to pending, ensuring correct requester/receiver
          existingConnection.requester = requester;
          existingConnection.receiver = receiver;
          existingConnection.requesterId = requesterId;
          existingConnection.receiverId = createDto.receiverId;
          existingConnection.status = ConnectionStatus.PENDING;
          const updatedConnection =
            await this.connectionRepository.save(existingConnection);

          return this.mapConnectionToDto(updatedConnection, requesterId);
        }
      } else {
        throw new ConflictException(
          'یک ارتباط یا درخواست در وضعیت غیر از انتظار/رد شده قبلاً وجود دارد.',
        );
      }
    }

    const newConnection = this.connectionRepository.create({
      requesterId, // or requester
      receiverId: createDto.receiverId, // or receiver
      requester, // for relation eager loading if needed for DTO mapping
      receiver, // for relation eager loading if needed for DTO mapping
      status: ConnectionStatus.PENDING,
    });

    const savedConnection = await this.connectionRepository.save(newConnection);

    // Re-fetch to ensure relations are loaded for DTO mapping if not using { reload: true } or similar
    const freshlySavedConnection = await this.findConnectionByIdOrFail(
      savedConnection.id,
    );

    return this.mapConnectionToDto(freshlySavedConnection, requesterId);
  }

  async acceptRequest(
    currentUserId: number,
    requestId: number,
  ): Promise<ConnectionDto> {
    const connection = await this.findConnectionByIdOrFail(requestId);

    if (connection.receiverId !== currentUserId) {
      throw new ForbiddenException('شما مجاز به پذیرش این درخواست نیستید.');
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      throw new ConflictException(
        'این درخواست در انتظار نیست و نمی‌تواند پذیرفته شود.',
      );
    }

    connection.status = ConnectionStatus.ACCEPTED;
    const updatedConnection = await this.connectionRepository.save(connection);
    return this.mapConnectionToDto(updatedConnection, currentUserId);
  }

  async rejectRequest(
    currentUserId: number,
    requestId: number,
  ): Promise<ConnectionDto> {
    const connection = await this.findConnectionByIdOrFail(requestId);

    if (connection.receiverId !== currentUserId) {
      throw new ForbiddenException('شما مجاز به رد این درخواست نیستید.');
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      throw new ConflictException(
        'این درخواست در انتظار نیست و نمی‌تواند رد شود.',
      );
    }

    connection.status = ConnectionStatus.REJECTED;
    const updatedConnection = await this.connectionRepository.save(connection);
    return this.mapConnectionToDto(updatedConnection, currentUserId);
  }

  async cancelSentRequest(
    currentUserId: number,
    requestId: number,
  ): Promise<void> {
    const connection = await this.findConnectionByIdOrFail(requestId);

    if (connection.requesterId !== currentUserId) {
      throw new ForbiddenException('شما مجاز به لغو این درخواست نیستید.');
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      throw new ConflictException('فقط درخواست‌های در انتظار قابل لغو هستند.');
    }

    await this.connectionRepository.delete(requestId);
  }

  async removeConnection(
    currentUserId: number,
    connectionId: number,
  ): Promise<void> {
    const connection = await this.findConnectionByIdOrFail(connectionId);

    if (
      connection.requesterId !== currentUserId &&
      connection.receiverId !== currentUserId
    ) {
      throw new ForbiddenException('شما بخشی از این ارتباط نیستید.');
    }

    if (connection.status !== ConnectionStatus.ACCEPTED) {
      throw new ConflictException('فقط ارتباط‌های پذیرفته شده قابل حذف هستند.');
    }
    // Instead of deleting, you might want to set a status like 'TERMINATED' or 'UNFRIENDED'
    // For simplicity, we delete.
    await this.connectionRepository.delete(connectionId);
  }

  async getPendingReceivedRequests(userId: number): Promise<ConnectionDto[]> {
    await this.findUserOrFail(userId); // Ensure user exists
    const connections = await this.connectionRepository.find({
      where: { receiverId: userId, status: ConnectionStatus.PENDING },
      relations: [
        'requester',
        'receiver',
        'requester.profileFile',
        'receiver.profileFile',
      ],
      order: { createdAt: 'DESC' },
    });
    return this.mapConnectionsToDtoArray(connections, userId);
  }

  async getPendingSentRequests(userId: number): Promise<ConnectionDto[]> {
    await this.findUserOrFail(userId); // Ensure user exists
    const connections = await this.connectionRepository.find({
      where: { requesterId: userId, status: ConnectionStatus.PENDING },
      relations: [
        'requester',
        'receiver',
        'requester.profileFile',
        'receiver.profileFile',
      ],
      order: { createdAt: 'DESC' },
    });
    return this.mapConnectionsToDtoArray(connections, userId);
  }

  async getAcceptedConnections(userId: number): Promise<ConnectionDto[]> {
    await this.findUserOrFail(userId);
    const connections = await this.connectionRepository.find({
      where: [
        { requesterId: userId, status: ConnectionStatus.ACCEPTED },
        { receiverId: userId, status: ConnectionStatus.ACCEPTED },
      ],
      relations: [
        'requester',
        'receiver',
        'requester.profileFile',
        'receiver.profileFile',
      ],
    });

    return this.mapConnectionsToDtoArray(connections, userId);
  }

  async getConnectionStatusWithUser(
    currentUserId: number,
    otherUserId: number,
  ): Promise<ConnectionStatusWithUserDto> {
    if (currentUserId === otherUserId) {
      throw new ConflictException('منظورت چیه که وضعیتت با خودت چیه ؟');
    }

    await this.findUserOrFail(currentUserId);
    await this.findUserOrFail(otherUserId);

    const connection = await this.findConnectionBetweenUsers(
      currentUserId,
      otherUserId,
    );

    if (!connection) {
      return {
        userId: otherUserId,
        status: ConnectionStatus.NOT_SEND,
        connectionId: undefined,
      };
    }

    return {
      userId: otherUserId,
      status: connection.status,
      connectionId: connection.id,
    };
  }

  async blockUser(
    blockerId: number,
    userIdToBlock: number,
  ): Promise<ConnectionDto> {
    if (blockerId === userIdToBlock) {
      throw new ConflictException('شما نمی‌توانید خودتان را مسدود کنید.');
    }
    const blocker = await this.findUserOrFail(blockerId);
    const userToBlock = await this.findUserOrFail(userIdToBlock);

    let connection = await this.findConnectionBetweenUsers(
      blockerId,
      userIdToBlock,
    );

    if (connection) {
      // If already blocked by this user, or they blocked us, do nothing or return current state.
      if (
        connection.status === ConnectionStatus.BLOCKED &&
        connection.requesterId === blockerId
      ) {
        // Already blocked by current user, return current state
        return this.mapConnectionToDto(connection, blockerId);
      }
      // If they blocked us, we might not be able to "override" their block with ours,
      // or it becomes a mutual block. Policy needed. For now, let's assume blocker takes precedence.
      connection.requester = blocker; // Blocker is always the requester in a BLOCK connection
      connection.receiver = userToBlock;
      connection.requesterId = blockerId;
      connection.receiverId = userIdToBlock;
      connection.status = ConnectionStatus.BLOCKED;
    } else {
      connection = this.connectionRepository.create({
        requester: blocker,
        receiver: userToBlock,
        requesterId: blockerId,
        receiverId: userIdToBlock,
        status: ConnectionStatus.BLOCKED,
      });
    }
    const savedConnection = await this.connectionRepository.save(connection);
    const reloadedConnection = await this.findConnectionByIdOrFail(
      savedConnection.id,
    );
    return this.mapConnectionToDto(reloadedConnection, blockerId);
  }

  async unblockUser(blockerId: number, userIdToUnblock: number): Promise<void> {
    if (blockerId === userIdToUnblock) {
      throw new ForbiddenException('عملیات نامعتبر است.');
    }
    await this.findUserOrFail(blockerId);
    await this.findUserOrFail(userIdToUnblock);

    const connection = await this.connectionRepository.findOne({
      where: {
        requesterId: blockerId, // Only the original blocker can unblock
        receiverId: userIdToUnblock,
        status: ConnectionStatus.BLOCKED,
      },
    });

    if (!connection) {
      throw new NotFoundException(
        'هیچ مسدودیت فعالی از سمت شما به این کاربر برای رفع مسدودیت یافت نشد.',
      );
    }

    // Unblocking means deleting the connection record if its sole purpose was the block.
    // If connections can exist with other statuses and then get blocked,
    // unblocking might mean reverting to a previous status or just removing the block.
    // For simplicity, if a connection is BLOCKED, unblocking deletes it.
    // This implies that blocking also overwrites any previous connection status.
    await this.connectionRepository.delete(connection.id);
  }
}

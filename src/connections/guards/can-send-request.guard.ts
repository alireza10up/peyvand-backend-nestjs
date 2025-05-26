import {
  CanActivate,
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConnectionsService } from '../connections.service';
import { CreateConnectionRequestDto } from '../dto/create-connection-request.dto';
import { ConnectionStatus } from '../enums/connection-status.enum';
import { UsersService } from '../../users/users.service';

@Injectable()
export class CanSendRequestGuard implements CanActivate {
  constructor(
    private readonly connectionsService: ConnectionsService,
    private readonly usersService: UsersService, // Inject UsersService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const currentUserId = request.user?.id;
    const body = request.body as CreateConnectionRequestDto;
    const receiverId = body.receiverId;

    if (!currentUserId || !receiverId) {
      throw new ForbiddenException('شناسه کاربر یا گیرنده ارائه نشده است.');
    }

    if (currentUserId === receiverId) {
      throw new ForbiddenException(
        'شما نمی‌توانید به خودتان درخواست ارتباط ارسال کنید.',
      );
    }

    try {
      // Check if a receiver exists
      const receiverExists = await this.usersService.findById(receiverId); // Throws NotFoundException if user doesn't exist

      if (!receiverExists) {
        throw new NotFoundException('کاربر مدنظر یافت نشد.');
      }

      // Check for an existing connection or block
      const existingConnection =
        await this.connectionsService.findConnectionBetweenUsers(
          currentUserId,
          receiverId,
        );

      if (existingConnection) {
        if (existingConnection.status === ConnectionStatus.PENDING) {
          throw new ConflictException(
            'یک درخواست در انتظار برای این کاربر قبلاً وجود دارد.',
          );
        }

        if (existingConnection.status === ConnectionStatus.ACCEPTED) {
          throw new ConflictException(
            'شما در حال حاضر با این کاربر در ارتباط هستید.',
          );
        }

        if (existingConnection.status === ConnectionStatus.BLOCKED) {
          // More detailed block checking might be needed here based on who initiated the block
          throw new ConflictException(
            'به دلیل وجود بلاک بین شما و این کاربر، امکان ارسال درخواست وجود ندارد.',
          );
        }
        // If REJECTED, the service's sendRequest method will handle updating it.
        // So, for the guard, if it's REJECTED, we can allow proceeding to the service.
        // The service then decides if it's a "resend" or a new request.
        // However, the current unique index might cause issues if not handled by updating.
        // For the guard, let's allow if it's REJECTED, and let the service manage the update/create logic.
        if (existingConnection.status !== ConnectionStatus.REJECTED) {
          const status: string = existingConnection.status;

          throw new ConflictException(
            `یک ارتباط موجود با وضعیت '${status}' مانع از ایجاد درخواست جدید می‌شود.`,
          );
        }
      }

      return true; // Allowed to proceed to the service
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Log other errors or rethrow a generic one
      throw new InternalServerErrorException(
        'خطا در اعتبارسنجی توانایی ارسال درخواست ارتباط.',
      );
    }
  }
}

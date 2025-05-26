import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConnectionsService } from '../connections.service';
import { ConnectionStatus } from '../enums/connection-status.enum';

@Injectable()
export class ConnectionRequesterGuard implements CanActivate {
  constructor(private readonly connectionsService: ConnectionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const currentUserId = request.user?.id;
    const requestIdString = request.params.requestId; // For sent-requests/:requestId

    if (!currentUserId || !requestIdString) {
      throw new ForbiddenException('شما درخواست‌دهنده این ارتباط نیستید.');
    }

    const requestId = parseInt(requestIdString, 10);

    if (isNaN(requestId)) {
      throw new ForbiddenException('شناسه درخواست نامعتبر است.');
    }

    try {
      const connection = await this.connectionsService.findConnectionByIdOrFail(
        requestId,
        [],
      );

      if (connection.requesterId !== currentUserId) {
        throw new ForbiddenException('شما مجاز به انجام این عملیات نیستید.');
      }

      if (connection.status !== ConnectionStatus.PENDING) {
        throw new ForbiddenException(
          'فقط درخواست‌های در انتظار می‌توانند توسط درخواست‌دهنده اصلاح شوند.',
        );
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'خطا در اعتبارسنجی فرستنده درخواست ارتباط.',
      );
    }
  }
}

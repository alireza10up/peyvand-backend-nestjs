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
export class ConnectionReceiverGuard implements CanActivate {
  constructor(private readonly connectionsService: ConnectionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const currentUserId = request.user?.id;
    const requestIdString = request.params.requestId;

    if (!currentUserId || !requestIdString) {
      throw new ForbiddenException(
        'شما دریافت‌کننده این درخواست ارتباط نیستید.',
      );
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

      if (connection.receiverId !== currentUserId) {
        throw new ForbiddenException('شما مجاز به انجام این عملیات نیستید.');
      }

      if (connection.status !== ConnectionStatus.PENDING) {
        throw new ForbiddenException('درخواست در وضعیت انتظار نیست.');
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
        'خطا در اعتبارسنجی گیرنده ارتباط.',
      );
    }
  }
}

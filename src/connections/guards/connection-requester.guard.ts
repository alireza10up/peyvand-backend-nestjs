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
      throw new ForbiddenException('Invalid Request ID.');
    }

    try {
      const connection = await this.connectionsService.findConnectionByIdOrFail(
        requestId,
        [],
      );

      if (connection.requesterId !== currentUserId) {
        throw new ForbiddenException(
          'You are not authorized to perform this action.',
        );
      }

      if (connection.status !== ConnectionStatus.PENDING) {
        throw new ForbiddenException(
          'Only pending requests can be modified by the requester.',
        );
      }

      // (request as any).connectionEntity = connection; // Optional
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error validating connection requester.',
      );
    }
  }
}

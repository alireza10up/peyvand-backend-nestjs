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
      throw new ForbiddenException();
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

      if (connection.receiverId !== currentUserId) {
        throw new ForbiddenException(
          'You are not authorized to perform this action.',
        );
      }

      if (connection.status !== ConnectionStatus.PENDING) {
        throw new ForbiddenException('Request is not in a pending state.');
      }

      // (request as any).connectionEntity = connection; // Optional: attach for controller
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error validating connection receiver.',
      );
    }
  }
}

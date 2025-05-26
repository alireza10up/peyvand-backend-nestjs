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
export class ConnectionParticipantGuard implements CanActivate {
  constructor(private readonly connectionsService: ConnectionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const currentUserId = request.user?.id;
    const connectionIdString = request.params.connectionId;

    if (!currentUserId || !connectionIdString) {
      throw new ForbiddenException();
    }
    const connectionId = parseInt(connectionIdString, 10);
    if (isNaN(connectionId)) {
      throw new ForbiddenException('Invalid Connection ID.');
    }

    try {
      const connection = await this.connectionsService.findConnectionByIdOrFail(
        connectionId,
        [],
      );

      if (
        connection.requesterId !== currentUserId &&
        connection.receiverId !== currentUserId
      ) {
        throw new ForbiddenException(
          'You are not a participant in this connection.',
        );
      }

      // For removing a connection, it should typically be in 'ACCEPTED' state
      if (connection.status !== ConnectionStatus.ACCEPTED) {
        throw new ForbiddenException(
          'Only accepted connections can be removed by participants.',
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
        'Error validating connection participant.',
      );
    }
  }
}

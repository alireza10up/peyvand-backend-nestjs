import { ConnectionStatus } from '../enums/connection-status.enum';

export class ConnectionStatusWithUserDto {
  userId: number; // The ID of the other user
  status: ConnectionStatus | null; // Current connection status, or null if no connection/request
  connectionId?: number; // The ID of the ConnectionEntity if one exists
  // We could add more flags here later, e.g.,
  // canCancelRequest?: boolean;
  // canAcceptRequest?: boolean;
}
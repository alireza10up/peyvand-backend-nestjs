import { ConnectionStatus } from '../enums/connection-status.enum';

export class ConnectionStatusWithUserDto {
  userId: number;
  status: ConnectionStatus | null;
  connectionId?: number;
}

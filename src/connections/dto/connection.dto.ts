import { ConnectionStatus } from '../enums/connection-status.enum';
import { UserSummaryDto } from '../../users/dto/user-summary.dto';

export class ConnectionDto {
  id: number;
  status: ConnectionStatus;
  user: UserSummaryDto | null; // Represents the other user in the connection
  createdAt: Date;
  updatedAt: Date;
}

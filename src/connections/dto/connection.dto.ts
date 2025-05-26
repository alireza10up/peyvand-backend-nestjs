import { ConnectionStatus } from '../enums/connection-status.enum';
import { UserSummaryDto } from '../../users/dto/user-summary.dto';

export class ConnectionDto {
  id: number;
  status: ConnectionStatus;
  user: UserSummaryDto | null; // Represents the other user in the connection
  createdAt: Date;
  updatedAt: Date;
  // Optional: To explicitly know if the current user initiated the request
  // This is particularly useful when the status is PENDING.
  // For ACCEPTED connections, it might be less relevant or derivable.
  // initiatedByMe?: boolean;
}

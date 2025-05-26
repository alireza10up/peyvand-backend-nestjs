import { IsEnum, IsNotEmpty } from 'class-validator';
import { ConnectionStatus } from '../enums/connection-status.enum';

export class UpdateConnectionStatusDto {
  @IsEnum(ConnectionStatus)
  @IsNotEmpty()
  status: ConnectionStatus; //  This would typically only be for ACCEPTED or REJECTED by the receiver
}

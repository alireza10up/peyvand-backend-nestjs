import { IsEnum, IsNotEmpty } from 'class-validator';
import { ConnectionStatus } from '../enums/connection-status.enum';

export class UpdateConnectionStatusDto {
  @IsEnum(ConnectionStatus)
  @IsNotEmpty()
  status: ConnectionStatus;
}

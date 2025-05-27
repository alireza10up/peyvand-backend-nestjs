import { UserEntity } from '../../users/entities/user.entity';
import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  user?: UserEntity;
}

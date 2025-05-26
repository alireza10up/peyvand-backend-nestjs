import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionsService } from './connections.service';
import { ConnectionsController } from './connections.controller';
import { ConnectionEntity } from './entities/connection.entity';
import { UsersModule } from '../users/users.module'; //  To access UsersService

@Module({
  imports: [
    TypeOrmModule.forFeature([ConnectionEntity]),
    forwardRef(() => UsersModule), // Use forwardRef if UsersModule also imports ConnectionsModule to avoid circular dependency
  ],
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}

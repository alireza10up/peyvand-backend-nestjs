import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ConnectionsService } from './connections.service';
import { CreateConnectionRequestDto } from './dto/create-connection-request.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { ConnectionDto } from './dto/connection.dto';
import { UserSummaryDto } from '../users/dto/user-summary.dto';
import { ConnectionStatusWithUserDto } from './dto/connection-status-with-user.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { CanSendRequestGuard } from './guards/can-send-request.guard';
import { ConnectionReceiverGuard } from './guards/connection-receiver.guard';
import { ConnectionRequesterGuard } from './guards/connection-requester.guard';
import { ConnectionParticipantGuard } from './guards/connection-participant.guard';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';

@Controller('connections')
@UseGuards(JwtAuthGuard)
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post('send-request')
  @UseGuards(CanSendRequestGuard)
  async sendRequest(
    @Request() req: RequestWithUser,
    @Body() createConnectionDto: CreateConnectionRequestDto,
  ): Promise<ConnectionDto> {
    const currentUserId = req.user.id;

    return this.connectionsService.sendRequest(
      currentUserId,
      createConnectionDto,
    );
  }

  @Delete('send-request/:requestId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ConnectionRequesterGuard)
  async cancelSentRequest(
    @Request() req: RequestWithUser,
    @Param('requestId', ParseIdPipe) requestId: number,
  ): Promise<void> {
    const currentUserId = req.user.id;
    await this.connectionsService.cancelSentRequest(currentUserId, requestId);
  }

  @Patch('requests/:requestId/accept')
  @UseGuards(ConnectionReceiverGuard)
  async acceptRequest(
    @Request() req: RequestWithUser,
    @Param('requestId', ParseIdPipe) requestId: number,
  ): Promise<ConnectionDto> {
    const currentUserId = req.user.id;
    return this.connectionsService.acceptRequest(currentUserId, requestId);
  }

  @Patch('requests/:requestId/reject')
  @UseGuards(ConnectionReceiverGuard)
  async rejectRequest(
    @Request() req: RequestWithUser,
    @Param('requestId', ParseIdPipe) requestId: number,
  ): Promise<ConnectionDto> {
    const currentUserId = req.user.id;
    return this.connectionsService.rejectRequest(currentUserId, requestId);
  }

  @Delete(':connectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ConnectionParticipantGuard)
  async removeConnection(
    @Request() req: RequestWithUser,
    @Param('connectionId', ParseIdPipe) connectionId: number,
  ): Promise<void> {
    const currentUserId = req.user.id;
    await this.connectionsService.removeConnection(currentUserId, connectionId);
  }

  @Get('requests/received')
  async getPendingReceivedRequests(
    @Request() req: RequestWithUser,
    // @Query() paginationOptions: any, // TODO: Add pagination DTO
  ): Promise<ConnectionDto[]> {
    const currentUserId = req.user.id;
    return this.connectionsService.getPendingReceivedRequests(currentUserId);
  }

  @Get('requests/sent')
  async getPendingSentRequests(
    @Request() req: RequestWithUser,
    // @Query() paginationOptions: any, // TODO: Add pagination DTO
  ): Promise<ConnectionDto[]> {
    const currentUserId = req.user.id;
    return this.connectionsService.getPendingSentRequests(currentUserId);
  }

  @Get('')
  async getAcceptedConnections(
    @Request() req: RequestWithUser,
    // @Query() paginationOptions: any, // TODO: Add pagination DTO
  ): Promise<UserSummaryDto[]> {
    const currentUserId = req.user.id;
    return this.connectionsService.getAcceptedConnections(currentUserId);
  }

  @Get('status/:userId')
  async getConnectionStatusWithUser(
    @Request() req: RequestWithUser,
    @Param('userId', ParseIdPipe) otherUserId: number,
  ): Promise<ConnectionStatusWithUserDto> {
    const currentUserId = req.user.id;

    return this.connectionsService.getConnectionStatusWithUser(
      currentUserId,
      otherUserId,
    );
  }

  @Get('user/:userId')
  async getAcceptedConnectionsByUser(
    @Param('userId', ParseIdPipe) userId: number,
  ) {
    return this.connectionsService.getAcceptedConnections(userId);
  }

  @Post('block')
  async blockUser(
    @Request() req: RequestWithUser,
    @Body() blockUserDto: BlockUserDto,
  ): Promise<ConnectionDto> {
    const currentUserId = req.user.id;

    return this.connectionsService.blockUser(
      currentUserId,
      blockUserDto.userId,
    );
  }

  @Delete('unblock/:userIdToUnblock')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblockUser(
    @Request() req: RequestWithUser,
    @Param('userIdToUnblock', ParseIdPipe) userIdToUnblock: number,
  ): Promise<void> {
    const currentUserId = req.user.id;
    await this.connectionsService.unblockUser(currentUserId, userIdToUnblock);
  }
}

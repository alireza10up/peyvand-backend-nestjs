import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/guard/admin.guard';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ConnectionsService } from '../connections/connections.service';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';
import { CommentsService } from '../comments/comments.service';
import { ConnectionStatus } from '../connections/enums/connection-status.enum';

interface NetworkNode {
  id: string;
  label: string;
  group: string;
}

interface NetworkEdge {
  from: string;
  to: string;
  label: ConnectionStatus;
  arrows: string;
  color: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly connectionService: ConnectionsService,
    private readonly userService: UsersService,
    private readonly postService: PostsService,
    private readonly commentService: CommentsService,
  ) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  getUsers(@Query() query: any) {
    return this.adminService.getUsers(query);
  }

  @Patch('users/:userId/admin')
  setAdmin(@Param('userId') userId: number, @Body('isAdmin') isAdmin: boolean) {
    return this.adminService.setAdmin(userId, isAdmin);
  }

  @Delete('users/:userId')
  deleteUser(@Param('userId') userId: number) {
    return this.adminService.deleteUser(userId);
  }

  @Patch('users/:userId/password')
  changeUserPassword(
    @Param('userId') userId: number,
    @Body('newPassword') newPassword: string,
  ) {
    return this.adminService.changeUserPassword(userId, newPassword);
  }

  @Get('posts')
  getPosts(@Query() query: any) {
    return this.adminService.getPosts(query);
  }

  @Delete('posts/:postId')
  deletePost(@Param('postId') postId: number) {
    return this.adminService.deletePost(postId);
  }

  @Get('comments')
  getComments(@Query() query: any) {
    return this.adminService.getComments(query);
  }

  @Delete('comments/:commentId')
  deleteComment(@Param('commentId') commentId: number) {
    return this.adminService.deleteComment(commentId);
  }

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() body: any) {
    return this.adminService.updateSettings(body);
  }

  @Get('system-info')
  getSystemInfo() {
    return this.adminService.getSystemInfo();
  }

  @Get('env')
  getEnvVars() {
    return this.adminService.getEnvVars();
  }

  @Post('restart')
  restartSystem() {
    return this.adminService.restartSystem();
  }

  @Get('logs')
  getLogs(@Query('limit') limit: number = 50) {
    return this.adminService.getLogs(limit);
  }

  @Post('logs')
  addLog(
    @Body()
    body: {
      level: 'info' | 'warn' | 'error';
      message: string;
      meta?: any;
    },
  ) {
    return this.adminService.addLog(body.level, body.message, body.meta);
  }

  @Get('relationships')
  async getRelationships() {
    const connections = await this.connectionService.findAll();

    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];
    const userIds = new Set();

    // Add nodes and edges for connections
    connections.forEach((connection) => {
      // Add requester node if not exists
      if (!userIds.has(connection.requester.id)) {
        nodes.push({
          id: `user_${connection.requester.id}`,
          label: connection.requester.email,
          group: 'users',
        });
        userIds.add(connection.requester.id);
      }

      // Add receiver node if not exists
      if (!userIds.has(connection.receiver.id)) {
        nodes.push({
          id: `user_${connection.receiver.id}`,
          label: connection.receiver.email,
          group: 'users',
        });
        userIds.add(connection.receiver.id);
      }

      // Add edge
      edges.push({
        from: `user_${connection.requester.id}`,
        to: `user_${connection.receiver.id}`,
        label: connection.status,
        arrows: 'to',
        color: connection.status === ConnectionStatus.ACCEPTED ? '#16a34a' : '#ca8a04',
      });
    });

    return { nodes, edges };
  }
}

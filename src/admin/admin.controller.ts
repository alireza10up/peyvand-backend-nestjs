import { Controller, Get, UseGuards, Patch, Param, Delete, Body, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/guard/admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
  changeUserPassword(@Param('userId') userId: number, @Body('newPassword') newPassword: string) {
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
}

import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';
import { CommentsService } from '../comments/comments.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
  ) {}

  async getOverview() {
    return {
      usersCount: await this.usersService.count(),
      postsCount: await this.postsService.count(),
      commentsCount: await this.commentsService.count(),
    };
  }

  async getUsers(query: any) {
    return this.usersService.findAll(query);
  }

  async setAdmin(userId: number, isAdmin: boolean) {
    return this.usersService.setAdmin(userId, isAdmin);
  }

  async deleteUser(userId: number) {
    return this.usersService.delete(userId);
  }

  async getPosts(query: any) {
    return this.postsService.findAll();
  }

  async deletePost(postId: number) {
    return this.postsService.delete(postId);
  }

  async getComments(query: any) {
    return this.commentsService.findAll(query);
  }

  async deleteComment(commentId: number) {
    return this.commentsService.delete(commentId);
  }

  async getSettings() {
    return {};
  }

  async updateSettings(body: any) {
    return {};
  }

  async changeUserPassword(userId: number, newPassword: string) {
    return this.usersService.changePassword(userId, newPassword);
  }
}

import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';
import { CommentsService } from '../comments/comments.service';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly configService: ConfigService,
  ) {}

  private logs: any[] = [];

  addLog(level: 'info' | 'warn' | 'error', message: string, meta?: any) {
    this.logs.unshift({
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
    });
    if (this.logs.length > 100) this.logs.length = 100;
  }

  async getLogs(limit = 50) {
    return this.logs.slice(0, limit);
  }

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

  async getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      hostname: os.hostname(),
      release: os.release(),
      userInfo: os.userInfo(),
    };
  }

  async getEnvVars() {
    // Only expose safe envs
    const keys = [
      'ENV_MODE',
      'PORT',
      'DB_HOST',
      'DB_PORT',
      'DB_USERNAME',
      'DB_NAME',
      'JWT_SECRET',
      'JWT_EXPIRES_IN',
      'UPLOAD_DESTINATION',
      'UPLOAD_MAX_FILE_SIZE',
      'UPLOAD_ALLOWED_MIME_TYPES',
      'FILE_EXPIRES_AT',
      'AI_MODELS',
      'OPENROUTER_BASE_URL',
      'AI_SYSTEM_PROMPT',
      'SITE_URL',
      'SITE_NAME',
    ];
    const envs = {};
    for (const key of keys) {
      envs[key] = this.configService.get(key);
    }
    return envs;
  }

  async restartSystem(): Promise<{ success: boolean; message: string }> {
    // Only works if the process manager (like pm2) restarts the app on exit
    try {
      setTimeout(() => {
        process.exit(0);
      }, 1000);
      return { success: true, message: 'در حال ریستارت سرور...' };
    } catch (e) {
      return { success: false, message: 'خطا در ریستارت: ' + e.message };
    }
  }

  // Example advanced settings (should be persisted in DB, here just as a placeholder)
  private settings = {
    commentsEnabled: true,
    registrationEnabled: true,
    postCreationEnabled: true,
  };

  async getSettings() {
    return this.settings;
  }

  async updateSettings(body: any) {
    this.settings = { ...this.settings, ...body };
    return this.settings;
  }

  async changeUserPassword(userId: number, newPassword: string) {
    return this.usersService.changePassword(userId, newPassword);
  }
}

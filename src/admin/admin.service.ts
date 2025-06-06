import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';
import { CommentsService } from '../comments/comments.service';
import { ConnectionsService } from '../connections/connections.service';
import { FilesService } from '../files/files.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

const execAsync = promisify(exec);

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly connectionsService: ConnectionsService,
    private readonly filesService: FilesService,
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
    const [
      usersCount,
      postsCount,
      commentsCount,
      connectionsCount,
      filesCount,
      recentUsers,
      recentPosts,
      recentConnections,
    ] = await Promise.all([
      this.usersService.count(),
      this.postsService.count(),
      this.commentsService.count(),
      this.connectionsService.count(),
      this.filesService.count(),
      this.usersService.findRecent(5),
      this.postsService.findRecent(5),
      this.connectionsService.findRecent(5),
    ]);

    return {
      usersCount,
      postsCount,
      commentsCount,
      connectionsCount,
      filesCount,
      recentUsers,
      recentPosts,
      recentConnections,
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

  async getFiles(query: any) {
    return this.filesService.findAll(query);
  }

  async deleteFile(id: number) {
    return this.filesService.remove(id);
  }

  async getSystemInfo() {
    const [cpuInfo, memoryInfo, uptimeInfo] = await Promise.all([
      this.getCpuInfo(),
      this.getMemoryInfo(),
      this.getUptime(),
    ]);

    return {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      uptime: os.uptime(),
      hostname: os.hostname(),
      userInfo: os.userInfo(),
      cpuInfo,
      memoryInfo,
      uptimeInfo,
    };
  }

  private async getCpuInfo() {
    try {
      const { stdout } = await execAsync('wmic cpu get loadpercentage');
      return stdout.split('\n')[1].trim();
    } catch (error) {
      return 'N/A';
    }
  }

  private async getMemoryInfo() {
    try {
      const { stdout } = await execAsync('wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /Value');
      const lines = stdout.split('\n');
      const freeMemory = parseInt(lines[1].split('=')[1]);
      const totalMemory = parseInt(lines[2].split('=')[1]);
      return {
        free: freeMemory,
        total: totalMemory,
        used: totalMemory - freeMemory,
      };
    } catch (error) {
      return {
        free: os.freemem(),
        total: os.totalmem(),
        used: os.totalmem() - os.freemem(),
      };
    }
  }

  private async getUptime() {
    try {
      const { stdout } = await execAsync('net statistics server');
      const match = stdout.match(/Statistics since (.*)/);
      if (!match) {
        return new Date(Date.now() - os.uptime() * 1000).toISOString();
      }
      return match[1];
    } catch (error) {
      return new Date(Date.now() - os.uptime() * 1000).toISOString();
    }
  }

  async getEnvVars() {
    const env = {};
    for (const key in process.env) {
      if (key.startsWith('APP_') || key.startsWith('DB_') || key.startsWith('JWT_')) {
        env[key] = process.env[key];
      }
    }
    return env;
  }

  async updateEnvVar(key: string, value: string) {
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    process.env[key] = value;
    return { success: true };
  }

  async restartSystem() {
    try {
      await execAsync('pm2 restart peyvand');
      return { success: true, message: 'System restarted successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getLiveLogs() {
    try {
      const { stdout } = await execAsync('pm2 logs peyvand --raw --lines 0');
      return stdout;
    } catch (error) {
      return '';
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

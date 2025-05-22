import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FilesService } from '../../files/files.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FilesCleanupService {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCleanup() {
    const now = new Date();
    const expiredFiles = await this.filesService.findExpiredFiles(now);

    for (const file of expiredFiles) {
      const uploadDir: string = this.configService.get<string>(
        'UPLOAD_DESTINATION',
        'uploads',
      );

      await this.filesService.deleteFileFromDisk(uploadDir, file.filename);
      await this.filesService.remove(file.id);
    }
  }
}

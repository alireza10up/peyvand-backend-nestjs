import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FilesService } from '../../files/files.service';

@Injectable()
export class FilesCleanupService {
  constructor(private readonly filesService: FilesService) {}

  @Cron(CronExpression.EVERY_SECOND)
  async handleCleanup() {
    const now = new Date();
    const expiredFiles = await this.filesService.findExpiredFiles(now);

    for (const file of expiredFiles) {
      await this.filesService.deleteFileFromDisk(file.filename);
      await this.filesService.remove(file.id);
    }
  }
}

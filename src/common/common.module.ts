import { FilesCleanupService } from './schedule/files-cleanup.service';
import { Module } from '@nestjs/common';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { LogFormatService } from './filters/log-format.service';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [FilesModule],
  providers: [LogFormatService, AllExceptionsFilter, FilesCleanupService],
  exports: [LogFormatService],
})
export class CommonModule {}

import { Module } from '@nestjs/common';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { FilesCleanupService } from './schedule/files-cleanup.service';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [FilesModule],
  providers: [AllExceptionsFilter, FilesCleanupService],
  exports: [AllExceptionsFilter],
})
export class CommonModule {}

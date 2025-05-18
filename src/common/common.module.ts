import { Module } from '@nestjs/common';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

@Module({
  providers: [AllExceptionsFilter],
  exports: [AllExceptionsFilter],
})
export class CommonModule {}

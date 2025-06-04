import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { University } from './university.entity';
import { UniversitiesService } from './universities.service';
import { UniversitiesController } from './universities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([University])],
  providers: [UniversitiesService],
  controllers: [UniversitiesController],
  exports: [UniversitiesService],
})
export class UniversitiesModule {}

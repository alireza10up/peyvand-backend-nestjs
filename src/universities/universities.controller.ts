import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { UniversitiesService } from './universities.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { AdminGuard } from '../auth/guard/admin.guard';

@Controller('admin/universities')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @Get()
  findAll() {
    return this.universitiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.universitiesService.findOne(Number(id));
  }

  @Post()
  create(@Body('name') name: string) {
    return this.universitiesService.create(name);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body('name') name: string) {
    return this.universitiesService.update(Number(id), name);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.universitiesService.remove(Number(id));
  }
}

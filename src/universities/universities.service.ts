import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { University } from './university.entity';

@Injectable()
export class UniversitiesService {
  constructor(
    @InjectRepository(University)
    private readonly universityRepository: Repository<University>,
  ) {}

  findAll(): Promise<University[]> {
    return this.universityRepository.find();
  }

  findOne(id: number): Promise<University | null> {
    return this.universityRepository.findOneBy({ id });
  }

  async create(name: string): Promise<University> {
    const university = this.universityRepository.create({ name });
    return this.universityRepository.save(university);
  }

  async update(id: number, name: string): Promise<University> {
    const university = await this.findOne(id);
    if (!university) throw new NotFoundException('University not found');
    university.name = name;
    return this.universityRepository.save(university);
  }

  async remove(id: number): Promise<void> {
    await this.universityRepository.delete(id);
  }
}

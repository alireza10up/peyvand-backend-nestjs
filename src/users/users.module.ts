import { Module, OnModuleInit } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { FilesModule } from '../files/files.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), FilesModule, ConfigModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule implements OnModuleInit {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Check if any admin exists
    const adminExists = await this.userRepository.findOne({
      where: {
        isAdmin: true,
      },
    });

    if (!adminExists) {
      // Create default admin
      const hashedPassword = await bcrypt.hash(
        this.configService.get<string>('DEFAULT_ADMIN_PASSWORD', '123456'),
        10,
      );

      const adminUser = this.userRepository.create({
        email: this.configService.get<string>(
          'DEFAULT_ADMIN_EMAIL',
          'admin@gmail.com',
        ),
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        username: 'admin',
        phoneNumber: '09123456789',
        bio: 'Default admin user',
        isAdmin: true,
      });

      await this.userRepository.save(adminUser);
      console.log('Default admin user created successfully');
    }
  }
}

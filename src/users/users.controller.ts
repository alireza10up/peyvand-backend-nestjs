import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { plainToInstance } from 'class-transformer';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(
    @Request() req: { user: { userId: number } },
  ): Promise<UserProfileDto> {
    const userId = req.user.userId;

    const user = await this.usersService.findById(userId);

    return plainToInstance(UserProfileDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: { user: { userId: number } },
    @Body() updateData: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const userId: number = req.user.userId;

    const updatedUser = await this.usersService.updateUser(userId, updateData);

    return plainToInstance(UserProfileDto, updatedUser);
  }
}

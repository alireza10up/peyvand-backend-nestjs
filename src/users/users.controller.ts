import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { plainToInstance } from 'class-transformer';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: RequestWithUser): Promise<UserProfileDto> {
    const userId = req.user.id;

    const user = await this.usersService.findById(userId);

    return plainToInstance(UserProfileDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId/profile')
  async getUserProfileById(
    @Param('userId', ParseIdPipe) userId: string,
  ): Promise<UserProfileDto> {
    const user = await this.usersService.findOrFailById(Number(userId));
    return plainToInstance(UserProfileDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateData: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const userId: number = req.user.id;

    const updatedUser = await this.usersService.updateUser(userId, updateData);

    return plainToInstance(UserProfileDto, updatedUser);
  }
}

import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { plainToInstance } from 'class-transformer';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from '../files/files.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private filesService: FilesService,
  ) {}

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

  @UseGuards(JwtAuthGuard)
  @Post('upload-profile')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async uploadProfile(
    @UploadedFile() file: any,
    @Request() req: { user: { userId: number } },
  ) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new Error('User not found');
    const fileRecord = await this.filesService.create(
      {
        filename: file.filename,
        mimetype: file.mimetype,
        url: `/uploads/${file.filename}`,
      },
      user,
    );
    await this.usersService.setProfileFile(req.user.userId, fileRecord.id);
    return fileRecord;
  }
}

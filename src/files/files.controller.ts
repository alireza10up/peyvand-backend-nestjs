import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { FilePrivateGuard } from './guards/file-private.guard';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UserEntity } from '../users/entities/user.entity';

interface CustomRequest extends Request {
  user: UserEntity;
}

@Controller('files')
export class FilesController {
  private uploadDestination: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];

  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
  ) {
    this.uploadDestination =
      this.configService.get<string>('UPLOAD_DESTINATION') || './uploads';
    this.maxFileSize =
      this.configService.get<number>('UPLOAD_MAX_FILE_SIZE') ||
      10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = this.configService
      .get<string>('UPLOAD_ALLOWED_MIME_TYPES')
      ?.split(',') || ['image/jpeg', 'image/png', 'application/pdf'];
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
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
      limits: {
        fileSize: this.maxFileSize,
      },
      fileFilter: (req, file, cb) => {
        const mimetype = file.mimetype as string; // مشخص کردن نوع فایل
        if (this.allowedMimeTypes.includes(mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('نوع فایل مجاز نیست'), false);
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: CustomRequest,
    @Body('visibility') visibility: 'public' | 'private',
  ) {
    const fileRecord = await this.filesService.create(
      {
        filename: file.filename,
        mimetype: file.mimetype,
        url: `/uploads/${file.filename}`,
        visibility: visibility || 'public',
      },
      req.user,
    );
    return fileRecord;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, FilePrivateGuard)
  async deleteFile(@Param('id') id: string) {
    const file = await this.filesService.findOne(+id);
    if (!file) {
      throw new BadRequestException('فایل یافت نشد');
    }

    await this.filesService.deleteFileFromDisk(file.filename);
    await this.filesService.remove(+id);

    return { message: 'فایل با موفقیت حذف شد' };
  }

  @Post('mark-used/:id')
  @UseGuards(JwtAuthGuard, FilePrivateGuard)
  async markFileAsUsed(@Param('id') id: string) {
    await this.filesService.markFileAsUsed(+id);
    return { message: 'فایل از صف پاکسازی حذف شد' };
  }

  @Get(':id')
  @UseGuards(FilePrivateGuard)
  async getPrivateFile(@Param('id') id: string) {
    return this.filesService.findOne(+id);
  }

  @Get('public/:id')
  async getPublicFile(@Param('id') id: string) {
    return this.filesService.findOne(+id);
  }
}

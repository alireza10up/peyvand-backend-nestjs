import {
  BadRequestException,
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
import { UploadedFile as UploadedFileInterface } from './interfaces/uploaded-file.interface';
import { FileVisibility } from './enums/file-visibility.enum';
import { RequestWithUser } from './interfaces/request-with-user.interface';

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_FILE_EXPIRES_AT = 7 * 24 * 60 * 60 * 1000;

@Controller('files')
export class FilesController {
  private static uploadDestination: string;
  private static maxFileSize: number;
  private static allowedMimeTypes: string[];
  private static fileExpiresAt: number;

  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
  ) {
    this.initializeConfiguration();
  }

  private initializeConfiguration(): void {
    FilesController.maxFileSize =
      this.configService.get<number>('UPLOAD_MAX_FILE_SIZE') ||
      DEFAULT_MAX_FILE_SIZE;

    FilesController.uploadDestination = this.configService.get<string>(
      'UPLOAD_DESTINATION',
      'uploads',
    );

    FilesController.allowedMimeTypes = this.configService
      .get<string>(
        'UPLOAD_ALLOWED_MIME_TYPES',
        'image/jpeg,image/png,application/pdf',
      )
      ?.split(',');

    FilesController.fileExpiresAt = Number(
      this.configService.get<number>('FILE_EXPIRES_AT') ??
        DEFAULT_FILE_EXPIRES_AT,
    );
  }

  @Post('private/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file: UploadedFileInterface, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: {
        fileSize: FilesController.maxFileSize,
      },
      fileFilter: (req, file: UploadedFileInterface, cb) => {
        if (FilesController.allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('نوع فایل مجاز نیست'), false);
        }
      },
    }),
  )
  async uploadPrivateFile(
    @UploadedFile() file: UploadedFileInterface,
    @Request() req: RequestWithUser,
  ) {
    return this.filesService.create(
      {
        filename: file.filename,
        mimetype: file.mimetype,
        url: `/${FilesController.uploadDestination}/${file.filename}`,
        visibility: FileVisibility.PRIVATE,
        expiresAt: FilesController.fileExpiresAt,
      },
      req.user,
    );
  }

  @Post('public/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file: UploadedFileInterface, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: {
        fileSize: FilesController.maxFileSize,
      },
      fileFilter: (req, file: UploadedFileInterface, cb) => {
        if (FilesController.allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('نوع فایل مجاز نیست'), false);
        }
      },
    }),
  )
  async uploadPublicFile(
    @UploadedFile() file: UploadedFileInterface,
    @Request() req: RequestWithUser,
  ) {
    return this.filesService.create(
      {
        filename: file.filename,
        mimetype: file.mimetype,
        url: `/${FilesController.uploadDestination}/${file.filename}`,
        visibility: FileVisibility.PUBLIC,
        expiresAt: FilesController.fileExpiresAt,
      },
      { id: req.user.id },
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, FilePrivateGuard)
  async deleteFile(@Param('id') id: string) {
    const file = await this.filesService.findOne(+id);
    if (!file) {
      throw new BadRequestException('فایل یافت نشد');
    }
    await this.filesService.deleteFileFromDisk(
      FilesController.uploadDestination,
      file.filename,
    );
    await this.filesService.remove(+id);
    return { message: 'فایل با موفقیت حذف شد' };
  }

  @Post('mark-used/:id')
  @UseGuards(JwtAuthGuard, FilePrivateGuard)
  async markFileAsUsed(@Param('id') id: string) {
    await this.filesService.markFileAsUsed(+id);
    return { message: 'فایل از صف پاکسازی حذف شد' };
  }

  @Get('private/:id')
  @UseGuards(JwtAuthGuard, FilePrivateGuard)
  async getPrivateFile(@Param('id') id: string) {
    return this.filesService.findOrFailed(+id, FileVisibility.PRIVATE);
  }

  @Get('public/:id')
  @UseGuards(JwtAuthGuard)
  async getPublicFile(@Param('id') id: string) {
    return this.filesService.findOrFailed(+id, FileVisibility.PUBLIC);
  }
}

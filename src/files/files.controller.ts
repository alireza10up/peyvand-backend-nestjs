import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Request,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FilePrivateGuard } from './guards/file-private.guard';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

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
    }),
  )
  async uploadFile(@UploadedFile() file: any, @Request() req) {
    const fileRecord = await this.filesService.create(
      {
        filename: file.filename,
        mimetype: file.mimetype,
        url: `/uploads/${file.filename}`,
      },
      req.user,
    );

    return fileRecord;
  }

  @Post('upload-post-file')
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
    }),
  )
  async uploadPostFile(@UploadedFile() file: any, @Request() req) {
    // Save file and associate with a post later
    const fileRecord = await this.filesService.create(
      {
        filename: file.filename,
        mimetype: file.mimetype,
        url: `/uploads/${file.filename}`,
        visibility: req.body.visibility || 'public',
      },
      req.user,
    );

    return fileRecord;
  }

  @Get(':id')
  @UseGuards(FilePrivateGuard)
  async getPrivateFile(@Param('id') id: string, @Request() req) {
    // Only owner can access private files
    return this.filesService.findOne(+id);
  }

  @Get('public/:id')
  async getPublicFile(@Param('id') id: string) {
    // Anyone can access public files
    return this.filesService.findOne(+id);
  }
}

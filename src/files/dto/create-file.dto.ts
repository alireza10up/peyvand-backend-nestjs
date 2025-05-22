import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { FileVisibility } from '../enums/file-visibility.enum';
import { Transform } from 'class-transformer';

export class CreateFileDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  mimetype: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  visibility?: FileVisibility;

  @IsNumber()
  @IsOptional()
  expiresAt?: number;
}

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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
  visibility?: 'public' | 'private';
}

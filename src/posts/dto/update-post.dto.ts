import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PostStatus } from '../enums/post-status.enum';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus;
}

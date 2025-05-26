import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'کامنت نمیتواند خالی باشد.' })
  @MinLength(1, { message: 'کامنت نمیتواند کمتر از ۱ کاراکتر باشد.' })
  @MaxLength(1000, {
    message: 'متن کامنت نمیتواند بیشتر از ۱۰۰۰ کاراکتر باشد.',
  })
  content: string;
}

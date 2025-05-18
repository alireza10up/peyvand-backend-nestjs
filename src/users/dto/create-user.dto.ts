import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'ایمیل نمی‌تواند خالی باشد' })
  @IsEmail({}, { message: 'لطفاً یک ایمیل معتبر وارد کنید' })
  email: string;

  @IsNotEmpty({ message: 'رمز عبور نمی‌تواند خالی باشد' })
  @IsString({ message: 'رمز عبور باید متن باشد' })
  @MinLength(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' })
  @MaxLength(32, { message: 'رمز عبور نمی‌تواند بیشتر از ۳۲ کاراکتر باشد' })
  password: string;
}

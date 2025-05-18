import { IsEmail, IsString, MaxLength, MinLength, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'ایمیل نمی‌تواند خالی باشد' })
  @IsEmail({}, { message: 'لطفاً یک ایمیل معتبر وارد کنید' })
  email: string;

  @IsNotEmpty({ message: 'رمز عبور نمی‌تواند خالی باشد' })
  @IsString({ message: 'رمز عبور باید متن باشد' })
  @MinLength(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' })
  @MaxLength(32, { message: 'رمز عبور نمی‌تواند بیشتر از ۳۲ کاراکتر باشد' })
  password: string;
}

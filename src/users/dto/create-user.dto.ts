import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsPhoneNumber,
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

  @IsOptional()
  @IsString({ message: 'نام باید متن باشد' })
  @MaxLength(50, { message: 'نام نمی‌تواند بیشتر از ۵۰ کاراکتر باشد' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'نام خانوادگی باید متن باشد' })
  @MaxLength(50, { message: 'نام خانوادگی نمی‌تواند بیشتر از ۵۰ کاراکتر باشد' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'نام کاربری باید متن باشد' })
  @MaxLength(30, { message: 'نام کاربری نمی‌تواند بیشتر از ۳۰ کاراکتر باشد' })
  username?: string;

  @IsOptional()
  @IsPhoneNumber('IR', { message: 'لطفاً یک شماره موبایل معتبر وارد کنید' })
  phoneNumber?: string;

  @IsOptional()
  @IsString({ message: 'بیو باید متن باشد' })
  @MaxLength(500, { message: 'بیو نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد' })
  bio?: string;

  @IsOptional()
  @IsBoolean({ message: 'وضعیت ادمین باید بولین باشد' })
  isAdmin?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'وضعیت تایید باید بولین باشد' })
  isVerified?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'وضعیت فعال بودن باید بولین باشد' })
  isActive?: boolean;
}

import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
  ArrayMaxSize,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @ValidateIf((obj, value) => value !== null)
  @IsString({ message: 'نام باید متن باشد' })
  @Length(1, 128, {
    message: 'نام باید بین ۱ تا ۱۲۸ کاراکتر باشد',
  })
  firstName?: string | null;

  @IsOptional()
  @ValidateIf((obj, value) => value !== null)
  @IsString({ message: 'نام خانوادگی باید متن باشد' })
  @Length(1, 128, {
    message: 'نام خانوادگی باید بین ۱ تا ۱۲۸ کاراکتر باشد',
  })
  lastName?: string | null;

  @IsOptional()
  @ValidateIf((obj, value) => value !== null)
  @IsDateString(
    {},
    {
      message: 'تاریخ تولد باید در قالب استاندارد تاریخ باشد',
    },
  )
  birthDate?: string | null;

  @IsOptional()
  @ValidateIf((obj, value) => value !== null)
  @IsString({ message: 'کد دانشجویی باید متن باشد' })
  @Length(1, 128, {
    message: 'کد دانشجویی باید بین ۱ تا ۱۲۸ کاراکتر باشد',
  })
  studentCode?: string | null;

  @IsOptional()
  @IsNumber()
  profileFile?: number;

  @IsOptional()
  @IsString({ message: 'بیوگرافی باید متن باشد' })
  @Length(0, 1000, { message: 'بیوگرافی نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد' })
  bio?: string;

  @IsOptional()
  @IsArray({ message: 'مهارت‌ها باید یک آرایه باشد' })
  @ArrayMaxSize(50, { message: 'حداکثر ۵۰ مهارت می‌توانید وارد کنید' })
  @IsString({ each: true, message: 'هر مهارت باید متن باشد' })
  skills?: string[];

  @IsOptional()
  @IsString({ message: 'نام دانشگاه باید متن باشد' })
  @Length(0, 128, { message: 'نام دانشگاه نمی‌تواند بیشتر از ۱۲۸ کاراکتر باشد' })
  university?: string;
}

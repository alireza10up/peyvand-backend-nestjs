import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

export class CreateUniversityDto {
  @IsNotEmpty({ message: 'نام دانشگاه نمی‌تواند خالی باشد' })
  @IsString({ message: 'نام دانشگاه باید رشته باشد' })
  @Length(3, 255, { message: 'نام دانشگاه باید بین ۳ تا ۲۵۵ کاراکتر باشد' })
  name: string;

  @IsOptional()
  @IsString({ message: 'شهر باید رشته باشد' })
  @Length(3, 255, { message: 'شهر باید بین ۳ تا ۲۵۵ کاراکتر باشد' })
  city?: string;
}
import {
  IsOptional,
  IsString,
  Length,
  IsDateString,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @ValidateIf((obj, value) => value !== null)
  @IsString({ message: 'نام باید متن باشد' })
  @Length(1, 128, {
    message: 'نام باید بین ۱ تا ۱۲۸ کاراکتر باشد',
  })
  first_name?: string | null;

  @IsOptional()
  @ValidateIf((obj, value) => value !== null)
  @IsString({ message: 'نام خانوادگی باید متن باشد' })
  @Length(1, 128, {
    message: 'نام خانوادگی باید بین ۱ تا ۱۲۸ کاراکتر باشد',
  })
  last_name?: string | null;

  @IsOptional()
  @ValidateIf((obj, value) => value !== null)
  @IsDateString(
    {},
    {
      message: 'تاریخ تولد باید در قالب استاندارد تاریخ باشد',
    },
  )
  birth_date?: string | null;

  @IsOptional()
  @ValidateIf((obj, value) => value !== null)
  @IsString({ message: 'کد دانشجویی باید متن باشد' })
  @Length(1, 128, {
    message: 'کد دانشجویی باید بین ۱ تا ۱۲۸ کاراکتر باشد',
  })
  student_code?: string | null;
}

import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
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
  bio?: string;

  @IsOptional()
  skills?: string[];

  @IsOptional()
  univer
}

import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateMessageDto {
  @IsString({ message: 'محتوای پیام باید متن باشد' })
  @IsNotEmpty({ message: 'محتوای پیام نمی‌تواند خالی باشد' })
  @ValidateIf(
    (o: Partial<CreateMessageDto>) =>
      !o.attachmentFileIds || o.attachmentFileIds.length === 0,
  )
  @MaxLength(2000, {
    message: 'محتوای پیام نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد',
  })
  content?: string;

  @IsNumber({}, { message: 'شناسه گفتگو باید عدد باشد' })
  @IsNotEmpty({ message: 'شناسه گفتگو نمی‌تواند خالی باشد' })
  conversationId: number;

  @IsArray({ message: 'شناسه‌های فایل پیوست باید آرایه‌ای از اعداد باشند' })
  @IsNumber({}, { each: true, message: 'هر شناسه فایل پیوست باید عدد باشد' })
  @IsOptional()
  @ArrayMinSize(1, { message: 'حداقل یک شناسه فایل پیوست باید ارسال شود' })
  @ValidateIf((o: Partial<CreateMessageDto>) => !o.content)
  attachmentFileIds?: number[];
}

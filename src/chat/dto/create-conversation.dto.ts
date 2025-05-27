import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateConversationDto {
  @IsNumber({}, { message: 'شناسه کاربر مقابل باید عدد باشد' })
  @IsNotEmpty({ message: 'شناسه کاربر مقابل نمی‌تواند خالی باشد' })
  participantId: number;
}

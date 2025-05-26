import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateConnectionRequestDto {
  @IsNumber()
  @IsNotEmpty()
  receiverId: number;
}

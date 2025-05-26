import { IsNotEmpty, IsNumber } from 'class-validator';

export class BlockUserDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}

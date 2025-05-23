import { IsInt, Min } from 'class-validator';

export class CreateLikeDto {
  @IsInt({ message: 'postId باید عدد صحیح باشد' })
  @Min(1, { message: 'postId باید بزرگتر از صفر باشد' })
  postId: number;
}

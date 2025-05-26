import { UserSummaryDto } from '../../users/dto/user-summary.dto';

export class CommentDto {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: UserSummaryDto | null;
  parentId?: number | null;
  replyCount?: number;
}

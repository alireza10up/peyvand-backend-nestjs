import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CommentsService } from '../comments.service';

@Injectable()
export class CommentOwnerGuard implements CanActivate {
  constructor(private readonly commentsService: CommentsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const currentUserId = request.user?.id;
    const commentIdString = request.params.commentId;

    if (!currentUserId || !commentIdString) {
      throw new ForbiddenException('شناسه کاربر یا کامنت ارائه نشده است.');
    }

    const commentId = parseInt(commentIdString, 10);
    if (isNaN(commentId)) {
      throw new ForbiddenException('شناسه کامنت نامعتبر است.');
    }

    try {
      const comment = await this.commentsService.findCommentByIdOrFail(
        commentId,
        ['user', 'post', 'post.user'],
      );

      if (!comment.user) {
        throw new InternalServerErrorException('اطلاعات سازنده کامنت میس شد.');
      }

      const isCommentOwner = comment.user.id === currentUserId;

      let canDeleteByPostOwner = false;
      if (request.method === 'DELETE' && comment.post && comment.post.user) {
        canDeleteByPostOwner = comment.post.user.id === currentUserId;
      }

      if (request.method === 'PATCH' && !isCommentOwner) {
        throw new ForbiddenException('شما مجاز به ویرایش این کامنت نیستید.');
      }

      if (
        request.method === 'DELETE' &&
        !isCommentOwner &&
        !canDeleteByPostOwner
      ) {
        throw new ForbiddenException('شما مجاز به حذف این کامنت نیستید.');
      }

      return true;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('خطا در اعتبار سنجی مالک.');
    }
  }
}

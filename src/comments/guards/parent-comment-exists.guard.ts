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
export class ParentCommentExistsGuard implements CanActivate {
  constructor(private readonly commentsService: CommentsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const parentCommentIdString = request.params.commentId;

    if (!parentCommentIdString) {
      throw new ForbiddenException('شناسه پست ارائه نشده است.');
    }
    const parentCommentId = parseInt(parentCommentIdString, 10);
    if (isNaN(parentCommentId)) {
      throw new ForbiddenException('شناسه پست نامعتبر است.');
    }

    try {
      const parentComment = await this.commentsService.findCommentByIdOrFail(
        parentCommentId,
        ['post'],
      ); // Load post to ensure it exists

      if (!parentComment.post) {
        throw new InternalServerErrorException('پست پدر میس شده.');
      }

      return true;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('خطا در اعتبار سنجی پست.');
    }
  }
}

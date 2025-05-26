import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PostsService } from '../posts.service';
import { PostStatus } from '../enums/post-status.enum';

@Injectable()
export class PostExistsAndCommentableGuard implements CanActivate {
  constructor(private readonly postsService: PostsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const postIdString = request.params.postId;

    if (!postIdString) {
      throw new ForbiddenException('شناسه پست ارائه نشده است.');
    }

    const postId = parseInt(postIdString, 10);
    if (isNaN(postId)) {
      throw new ForbiddenException('شناسه پست نامعتبر است.');
    }

    try {
      const post = await this.postsService.findOne(postId); // findOne already throws NotFound

      if (post.status !== PostStatus.PUBLISHED) {
        throw new ForbiddenException(
          'کامنت فقط میتواند روی پست های پابلیش شده ثبت شود.',
        );
      }

      return true;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error validating post for comments.',
      );
    }
  }
}

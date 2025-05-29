import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PostsService } from '../posts.service';

@Injectable()
export class PostVisibilityGuard implements CanActivate {
  constructor(private postsService: PostsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const postId = request.params.id;

    if (!postId) {
      return true;
    }

    const id = Number(postId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('شناسه نا معتبر است');
    }

    const post = await this.postsService.findOne(+postId);

    if (post.status !== 'published' && (!user || post.user.id !== user.id)) {
      throw new ForbiddenException('شما مجاز به دیدن این پست نیستید.');
    }

    return true;
  }
}

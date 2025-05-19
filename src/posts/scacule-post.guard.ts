import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PostsService } from './posts.service';

@Injectable()
export class PostVisibilityGuard implements CanActivate {
  constructor(private postsService: PostsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const postId = request.params.id;
    if (!postId) return true;
    const post = await this.postsService.findOne(+postId);
    if (post.status !== 'published' && (!user || post.author.id !== user.id)) {
      throw new ForbiddenException('You are not allowed to see this post');
    }
    return true;
  }
}

import { Reflector } from '@nestjs/core';

@Injectable()
export class PostOwnerGuard implements CanActivate {
  constructor(private postsService: PostsService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const postId = request.params.id;
    if (!postId) return false;
    const post = await this.postsService.findOne(+postId);
    if (!user || post.author.id !== user.id) {
      throw new ForbiddenException('You can only modify your own posts');
    }
    return true;
  }
}

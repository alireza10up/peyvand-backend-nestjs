import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { PostVisibilityGuard } from './guards/post-visibility.guard';
import { PostOwnerGuard } from './guards/post-owner.guard';
import { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';
import { LikesService } from '../likes/likes.service';
import { PostStatus } from './enums/post-status.enum';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly likesService: LikesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createPostDto: CreatePostDto,
    @Request() req: RequestWithUser,
  ) {
    return this.postsService.create(createPostDto, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.postsService.findAll(PostStatus.PUBLISHED);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PostVisibilityGuard)
  findOne(@Param('id', ParseIdPipe) id: string) {
    return this.postsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PostOwnerGuard)
  update(
    @Param('id', ParseIdPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(+id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PostOwnerGuard)
  async remove(@Param('id', ParseIdPipe) id: string) {
    const resultDelete = await this.postsService.remove(+id);

    if (!resultDelete) {
      throw new BadRequestException('پست حذف نشد');
    }

    return { message: 'پست حذف شد' };
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async likePost(
    @Request() req: RequestWithUser,
    @Param('id', ParseIdPipe) postId: number,
  ) {
    const userId = req.user.id;

    await this.likesService.likePost(userId, postId);

    const count = await this.likesService.countLikes(postId);

    const isLikedByCurrentUser = await this.likesService.hasUserLiked(
      userId,
      postId,
    );

    return { message: 'پست لایک شد', count, isLikedByCurrentUser };
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  async unlikePost(
    @Request() req: RequestWithUser,
    @Param('id', ParseIdPipe) postId: number,
  ) {
    const userId = req.user.id;

    await this.likesService.unlikePost(userId, postId);

    const count = await this.likesService.countLikes(postId);

    const isLikedByCurrentUser = await this.likesService.hasUserLiked(
      userId,
      postId,
    );

    return { message: 'لایک حذف شد', count, isLikedByCurrentUser };
  }

  @Get(':id/likes/count')
  @UseGuards(JwtAuthGuard)
  async countLikes(
    @Param('id', ParseIdPipe) postId: number,
    @Request() req?: RequestWithUser,
  ) {
    const count = await this.likesService.countLikes(postId);
    let isLikedByCurrentUser = false;

    if (req && req.user) {
      isLikedByCurrentUser = await this.likesService.hasUserLiked(
        req.user.id,
        postId,
      );
    }

    return { postId, count, isLikedByCurrentUser };
  }

  @Post(':id/like-toggle')
  @UseGuards(JwtAuthGuard)
  async toggleLike(
    @Request() req: RequestWithUser,
    @Param('id', ParseIdPipe) postId: number,
  ) {
    const userId = req.user.id;

    let message: string;
    let isLikedByCurrentUser: boolean;

    if (await this.likesService.hasUserLiked(userId, postId)) {
      await this.likesService.unlikePost(userId, postId);
      message = 'لایک حذف شد';
      isLikedByCurrentUser = false;
    } else {
      await this.likesService.likePost(userId, postId);
      message = 'لایک شد';
      isLikedByCurrentUser = true;
    }

    const count = await this.likesService.countLikes(postId);

    return { message, count, isLikedByCurrentUser };
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  getPublishedPostsByUser(
    @Param('userId', ParseIdPipe) userId: number,
    @Request() req: RequestWithUser,
  ) {
    const currentUserId = req.user.id;

    if (currentUserId === userId) {
      return this.postsService.findAllByUser(userId);
    }

    return this.postsService.findAllByUser(userId, PostStatus.PUBLISHED);
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
    return this.postsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PostVisibilityGuard)
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PostOwnerGuard)
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(+id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PostOwnerGuard)
  async remove(@Param('id') id: string) {
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
    @Param('id', ParseIntPipe) postId: number,
  ) {
    const userId = req.user.id;

    await this.likesService.likePost(userId, postId);

    return { message: 'پست لایک شد' };
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  async unlikePost(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    const userId = req.user.id;

    await this.likesService.unlikePost(userId, postId);

    return { message: 'لایک حذف شد' };
  }

  @Get(':id/likes/count')
  async countLikes(@Param('id', ParseIntPipe) postId: number) {
    const count = await this.likesService.countLikes(postId);

    return { postId, count };
  }

  @Post(':id/like-toggle')
  @UseGuards(JwtAuthGuard)
  async toggleLike(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    const userId = req.user.id;

    const hasLiked = await this.likesService.hasUserLiked(userId, postId);

    if (hasLiked) {
      await this.likesService.unlikePost(userId, postId);

      return { message: 'لایک حذف شد' };
    } else {
      await this.likesService.likePost(userId, postId);

      return { message: 'لایک شد' };
    }
  }
}

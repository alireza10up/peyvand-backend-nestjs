import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentDto } from './dto/comment.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { PostExistsAndCommentableGuard } from '../posts/guards/post-exists-and-commentable.guard';
import { CommentOwnerGuard } from './guards/comment-owner.guard';
import { ParentCommentExistsGuard } from './guards/parent-comment-exists.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('posts/:postId/comments')
  @UseGuards(PostExistsAndCommentableGuard) // TODO: Implement guard to check if post exists and is commentable
  async createComment(
    @Request() req: RequestWithUser,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentDto> {
    const userId = req.user.id;
    return this.commentsService.createComment(userId, postId, createCommentDto);
  }

  @Get('posts/:postId/comments')
  @UseGuards(PostExistsAndCommentableGuard) // TODO: Implement guard
  async getCommentsForPost(
    @Param('postId', ParseIntPipe) postId: number,
    // @Query() paginationDto: PaginationDto, // TODO: Add pagination DTO
  ): Promise<CommentDto[]> {
    return this.commentsService.getCommentsByPostId(postId);
  }

  @Patch('comments/:commentId')
  @UseGuards(CommentOwnerGuard) // TODO: Implement guard to ensure user owns the comment
  async updateComment(
    @Request() req: RequestWithUser,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<CommentDto> {
    const userId = req.user.id;
    return this.commentsService.updateComment(
      userId,
      commentId,
      updateCommentDto,
    );
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(CommentOwnerGuard)
  async deleteComment(
    @Request() req: RequestWithUser,
    @Param('commentId', ParseIntPipe) commentId: number,
  ): Promise<void> {
    const userId = req.user.id;
    await this.commentsService.deleteComment(userId, commentId);
  }

  @Post('comments/:commentId/replies')
  @UseGuards(ParentCommentExistsGuard)
  async createReply(
    @Request() req: RequestWithUser,
    @Param('commentId', ParseIntPipe) parentCommentId: number,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentDto> {
    const userId = req.user.id;
    return this.commentsService.createReply(
      userId,
      parentCommentId,
      createCommentDto,
    );
  }

  @Get('comments/:commentId/replies')
  async getRepliesForComment(
    @Param('commentId', ParseIntPipe) parentCommentId: number,
    // @Query() paginationDto: PaginationDto, // TODO: Add pagination DTO
  ): Promise<CommentDto[]> {
    return this.commentsService.getRepliesByParentId(parentCommentId);
  }
}

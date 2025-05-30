import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, IsNull, Repository } from 'typeorm';
import { CommentEntity } from './entities/comment.entity';
import { UserEntity } from '../users/entities/user.entity';
import { PostEntity } from '../posts/entities/post.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentDto } from './dto/comment.dto';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';
import { UserSummaryDto } from '../users/dto/user-summary.dto';
import { PostStatus } from '../posts/enums/post-status.enum';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  // --- Helper Methods ---

  private async findUserOrFail(userId: number): Promise<UserEntity> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`${userId}  یافت نشد کابر با شناسه `);
    }
    return user;
  }

  private async findPostOrFail(
    postId: number,
    checkPublished: boolean = true,
  ): Promise<PostEntity> {
    const post = await this.postsService.findOne(postId);

    if (!post) {
      throw new NotFoundException(`${postId} یافت نشد پست با شناسه `);
    }

    if (checkPublished && post.status !== PostStatus.PUBLISHED) {
      throw new ForbiddenException(
        'کامنت فقط میتواند روی پست های پابلیش شده ثبت شود',
      );
    }

    return post;
  }

  async findCommentByIdOrFail(
    commentId: number,
    relations: string[] = [],
  ): Promise<CommentEntity> {
    const findOptions: FindOneOptions<CommentEntity> = {
      where: { id: commentId },
    };

    if (relations.length > 0) {
      findOptions.relations = relations;
    }

    const comment = await this.commentRepository.findOne(findOptions);

    if (!comment) {
      throw new NotFoundException(`با شناسه ${commentId} یافت نشد کامنت `);
    }

    return comment;
  }

  private mapUserToSummaryDto(user: UserEntity): UserSummaryDto | null {
    if (!user) {
      return null;
    }

    const summary = new UserSummaryDto();
    summary.id = user.id;
    summary.firstName = user.firstName;
    summary.lastName = user.lastName;
    summary.email = user.email;

    if (user.profileFile) {
      summary.profileFile = {
        id: user.profileFile.id,
        url: user.profileFile.url,
        mimetype: user.profileFile.mimetype,
      };
    } else {
      summary.profileFile = null;
    }

    return summary;
  }

  private async mapCommentToDto(
    comment: CommentEntity,
    includeRepliesDepth: number = 0,
  ): Promise<CommentDto> {
    const dto = new CommentDto();
    dto.id = comment.id;
    dto.content = comment.content;
    dto.createdAt = comment.createdAt;
    dto.updatedAt = comment.updatedAt;

    if (!comment.user) {
      throw new InternalServerErrorException('کاربر کامنت میس شده.');
    }

    dto.user = this.mapUserToSummaryDto(comment.user);

    dto.parentId = comment.parent ? comment.parent.id : null;

    // TODO This could be optimized, e.g., by a subquery or a dedicated counter column if performance is critical
    const replyCount = await this.commentRepository.count({
      where: { parent: { id: comment.id } },
    });
    dto.replyCount = replyCount;

    if (
      includeRepliesDepth > 0 &&
      comment.replies &&
      comment.replies.length > 0
    ) {
      dto.replies = await Promise.all(
        comment.replies.map((reply) =>
          this.mapCommentToDto(reply, includeRepliesDepth - 1),
        ),
      );
    } else if (includeRepliesDepth > 0) {
      dto.replies = [];
    }

    return dto;
  }

  // --- Core Comment Methods ---

  async createComment(
    userId: number,
    postId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentDto> {
    const user = await this.findUserOrFail(userId);
    const post = await this.findPostOrFail(postId);

    const comment = this.commentRepository.create({
      ...createCommentDto,
      user,
      post,
    });

    const savedComment = await this.commentRepository.save(comment);
    const newCommentWithUser = await this.findCommentByIdOrFail(
      savedComment.id,
      ['user', 'user.profileFile', 'parent'],
    );
    return this.mapCommentToDto(newCommentWithUser);
  }

  async getCommentsByPostId(
    postId: number,
    //  paginationDto: PaginationDto // TODO: pagination
  ): Promise<CommentDto[]> {
    await this.findPostOrFail(postId, false);

    const comments = await this.commentRepository.find({
      where: { post: { id: postId }, parent: IsNull() },
      relations: [
        'user',
        'user.profileFile' /* 'replies', 'replies.user', 'replies.user.profileFile' */,
      ],
      order: { createdAt: 'ASC' },
      //  take: paginationDto.limit, // TODO
      //  skip: paginationDto.skip, // TODO
    });

    return Promise.all(
      comments.map((comment) => this.mapCommentToDto(comment, 0)),
    );
  }

  async updateComment(
    userId: number,
    commentId: number,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentDto> {
    const comment = await this.findCommentByIdOrFail(commentId, [
      'user',
      'user.profileFile',
      'parent',
      'post',
    ]);

    if (comment.user.id !== userId) {
      throw new ForbiddenException(
        'شما نمی‌توانید کامنت این پست را ویرایش کنید.',
      );
    }

    comment.content = updateCommentDto.content;
    const updatedComment = await this.commentRepository.save(comment);
    return this.mapCommentToDto(updatedComment);
  }

  async deleteComment(userId: number, commentId: number): Promise<void> {
    const comment = await this.findCommentByIdOrFail(commentId, [
      'user',
      'post',
      'post.user',
    ]);

    const isCommentOwner = comment.user.id === userId;
    const isPostOwner = comment.post.user.id === userId;

    if (!isCommentOwner && !isPostOwner) {
      throw new ForbiddenException('شما نمی‌توانید کامنت این پست را حذف کنید.');
    }

    await this.commentRepository.remove(comment);
  }

  // --- Reply Methods ---

  async createReply(
    userId: number,
    parentCommentId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentDto> {
    const user = await this.findUserOrFail(userId);
    const parentComment = await this.findCommentByIdOrFail(parentCommentId, [
      'post',
    ]);

    if (!parentComment.post) {
      throw new InternalServerErrorException(
        'Parent comment is not associated with a post.',
      );
    }

    const reply = this.commentRepository.create({
      ...createCommentDto,
      user,
      post: parentComment.post,
      parent: parentComment,
    });

    const savedReply = await this.commentRepository.save(reply);
    const newReplyWithRelations = await this.findCommentByIdOrFail(
      savedReply.id,
      ['user', 'user.profileFile', 'parent', 'post'],
    );

    return this.mapCommentToDto(newReplyWithRelations);
  }

  async getRepliesByParentId(
    parentCommentId: number,
    //  paginationDto: PaginationDto // TODO
  ): Promise<CommentDto[]> {
    await this.findCommentByIdOrFail(parentCommentId);

    const replies = await this.commentRepository.find({
      where: { parent: { id: parentCommentId } },
      relations: ['user', 'user.profileFile', 'parent'],
      order: { createdAt: 'ASC' },
      //  take: paginationDto.limit, // TODO
      //  skip: paginationDto.skip, // TODO
    });

    return Promise.all(replies.map((reply) => this.mapCommentToDto(reply, 0)));
  }
}

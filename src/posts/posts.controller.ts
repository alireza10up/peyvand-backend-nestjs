import { Controller, Get, Post as HttpPost, Body, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { PostVisibilityGuard } from './guards/post-visibility.guard';
import { PostOwnerGuard } from './guards/post-owner.guard';
import { Post } from './entities/post.entity';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @HttpPost()
  @UseGuards(JwtAuthGuard)
  create(@Body() createPostDto: CreatePostDto, @Request() req) {
    return this.postsService.create(createPostDto, req.user);
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  @UseGuards(PostVisibilityGuard)
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(PostOwnerGuard)
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto, @Request() req) {
    return this.postsService.update(+id, updatePostDto, req.user);
  }

  @Delete(':id')
  @UseGuards(PostOwnerGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.postsService.remove(+id, req.user);
  }
}

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatCompletionDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('completion')
  async chatCompletion(@Body() chatCompletionDto: ChatCompletionDto) {
    return {
      response: await this.aiService.chatCompletion(
        chatCompletionDto.messages,
        chatCompletionDto.customPrompt,
      ),
    };
  }
}

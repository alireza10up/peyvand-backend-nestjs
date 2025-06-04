import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;
  private readonly models: string[];
  private readonly systemPrompt: string;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      baseURL: this.configService.get<string>('OPENROUTER_BASE_URL'),
      apiKey: this.configService.get<string>('OPENROUTER_API_KEY'),
    });

    this.models = this.configService.get<string>('AI_MODELS', '').split(',');
    this.systemPrompt = this.configService.get<string>('AI_SYSTEM_PROMPT', '');
  }

  private getRandomModel(): string {
    const randomIndex = Math.floor(Math.random() * this.models.length);
    return this.models[randomIndex];
  }

  async chatCompletion(
    messages: Array<{ role: string; content: string }>,
    customPrompt?: string,
  ): Promise<string | null> {
    try {
      const model = this.getRandomModel();
      const formattedMessages: ChatCompletionMessageParam[] = messages.map(
        (msg) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        }),
      );

      formattedMessages.unshift({
        role: 'system',
        content: this.systemPrompt + ' ' + (customPrompt ?? ' '),
      });

      const completion = await this.openai.chat.completions.create(
        {
          model,
          messages: formattedMessages,
        },
        {},
      );

      return completion?.choices[0]?.message?.content ?? null;
    } catch (error) {
      this.logger.error(
        'Error in chat completion:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw new BadRequestException('اندکی بعد مجدد تلاش کنید !');
    }
  }
}

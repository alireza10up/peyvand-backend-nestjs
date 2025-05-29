import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  constructor(private readonly errorMessage = 'شناسه نامعتبر است.') {}

  transform(value: string, metadata: ArgumentMetadata): number {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException(this.errorMessage);
    }
    return id;
  }
}

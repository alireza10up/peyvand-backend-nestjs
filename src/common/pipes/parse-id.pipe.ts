import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ArgumentMetadata } from '@nestjs/common/interfaces/features/pipe-transform.interface';

@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  constructor() {}

  transform(value: string, metadata: ArgumentMetadata): number {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('شناسه نا معتبر است');
    }
    return id;
  }
}

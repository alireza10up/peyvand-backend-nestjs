import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { FilesService } from '../files.service';

@Injectable()
export class FilePrivateGuard implements CanActivate {
  constructor(private filesService: FilesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const fileId = request.params.id;

    if (!fileId) {
      return false;
    }
    const file = await this.filesService.findOne(+fileId);

    if (!user || file?.user?.id !== user?.id) {
      throw new ForbiddenException('شما مجاز به دیدن این فایل نیستید.');
    }

    return true;
  }
}

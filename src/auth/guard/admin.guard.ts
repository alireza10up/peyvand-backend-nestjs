import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('دسترسی غیرمجاز.');
    }

    if (user.isAdmin) {
      return true;
    }

    const dbUser = await this.usersService.findById(user.id);
    if (dbUser && dbUser.isAdmin) {
      return true;
    }
    
    throw new ForbiddenException('دسترسی فقط برای ادمین مجاز است.');
  }
}

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(registerDto: RegisterDto) {
    const existingUser: User | null = await this.usersService.findByEmail(
      registerDto.email,
    );

    if (existingUser) {
      throw new ConflictException('این ایمیل از قبل وجود دارد');
    }

    const user: User | undefined = await this.usersService.create(registerDto);

    if (!user) {
      throw new InternalServerErrorException('خطای داخلی سرور');
    }

    const payload: Record<string, string | number> = {
      email: user.email,
      sub: user.id,
    };

    return this.jwtService.sign(payload);
  }

  async signIn(loginDto: LoginDto): Promise<string> {
    const user: User | null = await this.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new ForbiddenException('کاربری با این اطلاعات یافت نشد');
    }

    const payload: Record<string, string | number> = {
      email: user.email,
      sub: user.id,
    };

    return this.jwtService.sign(payload);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user: User | null = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }
}

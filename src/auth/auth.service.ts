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
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(registerDto: RegisterDto) {
    const existingUser: Partial<UserEntity> | null =
      await this.usersService.findByEmailForAuth(registerDto.email);

    if (existingUser) {
      throw new ConflictException('این ایمیل از قبل وجود دارد');
    }

    registerDto.password = await bcrypt.hash(registerDto.password, 10);

    const user: UserEntity | undefined =
      await this.usersService.create(registerDto);

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
    const user: Partial<UserEntity> | null = await this.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new ForbiddenException('ایمیل یا رمز عبور اشتباه است.');
    }

    const payload: Record<string, string | number | undefined> = {
      email: user.email,
      sub: user.id,
    };

    return this.jwtService.sign(payload);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Partial<UserEntity> | null> {
    const user: Partial<UserEntity> | null =
      await this.usersService.findByEmailForAuth(email);

    if (user?.password && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }
}

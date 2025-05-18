import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signUp')
  async signUp(@Body() registerDto: RegisterDto) {
    const accessToken: string = await this.authService.signUp(registerDto);

    return {
      accessToken,
    };
  }

  @Post('signIn')
  async signIn(@Body() loginDto: LoginDto) {
    const accessToken = await this.authService.signIn(loginDto);

    return {
      accessToken,
    };
  }
}

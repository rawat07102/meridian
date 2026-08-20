import { Body, Controller, Get, Inject, Post, Redirect, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { AuthGuard } from '@nestjs/passport';
import type { ConfigType } from '@nestjs/config';
import { appConfig } from '../app-config/app.config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto);
  }

  // Google OAuth
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport redirects to Google — this handler body never actually runs
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @Redirect()
  async googleCallback(@Req() req: Request) {
    const googleUser = req.user as { email: string; fullName: string };
    const tokens = await this.authService.googleLogin(googleUser);
    const redirectUrl = new URL(`${this.config.frontendUrl}/auth/google/callback`);
    redirectUrl.searchParams.set('accessToken', tokens.accessToken);
    redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);

    return {
      url: redirectUrl.toString(),
      statusCode: 302,
    };
  }
}

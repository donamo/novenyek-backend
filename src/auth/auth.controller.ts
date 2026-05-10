import { Controller, Get, Logger, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthMeResponse } from './dto/auth-me.response';
import { LogoutResponse } from './dto/logout.response';
import { CurrentUser } from './current-user.decorator';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { AuthenticatedRequest, AuthenticatedUser } from './auth.types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly config: ConfigService) {}

  @Get('login/google')
  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard('google'))
  loginGoogle(): void {
    return;
  }

  @Get('callback/google')
  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard('google'))
  googleCallback(
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ): void {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', '/');

    // NestJS AuthGuard defaults to session:false, so req.logIn() is never called
    // automatically. We call it explicitly here to regenerate the session and
    // write passport.user into it, then redirect.
    request.logIn(request.user!, (err?: Error) => {
      if (err) {
        this.logger.error('Session login failed after Google OAuth', err);
        response.status(500).json({ message: 'Login failed' });
        return;
      }
      this.logger.debug(`Session established: sid=${request.sessionID}`);
      response.redirect(frontendUrl);
    });
  }

  @Get('me')
  @UseGuards(AuthenticatedGuard)
  @ApiOkResponse({ type: AuthMeResponse })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  me(@CurrentUser() user: AuthenticatedUser): AuthMeResponse {
    return user;
  }

  @Post('logout')
  @UseGuards(AuthenticatedGuard)
  @ApiOkResponse({ type: LogoutResponse })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  logout(@Req() request: AuthenticatedRequest, @Res() response: Response): void {
    request.logout((error?: Error) => {
      if (error) {
        response.status(500).json({ message: 'Logout failed' });
        return;
      }

      request.session.destroy(() => {
        response.clearCookie('connect.sid');
        response.json({ loggedOut: true });
      });
    });
  }
}

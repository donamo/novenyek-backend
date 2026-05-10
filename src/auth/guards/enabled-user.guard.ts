import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { AuthenticatedRequest } from '../auth.types';

@Injectable()
export class EnabledUserGuard implements CanActivate {
  private readonly logger = new Logger(EnabledUserGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);
    const sessionUser = request.user;

    if (!request.isAuthenticated?.() || !sessionUser) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await this.authService.findUserById(sessionUser.id);

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    request.user = user;

    if (user.isAdmin || user.isEnabled) {
      return true;
    }

    this.logger.warn(`Blocked disabled user: ${user.id}`);
    throw new ForbiddenException('User is not enabled');
  }

  private getRequest(context: ExecutionContext): AuthenticatedRequest {
    if (context.getType<string>() === 'graphql') {
      return GqlExecutionContext.create(context).getContext<{
        req: AuthenticatedRequest;
      }>().req;
    }

    return context.switchToHttp().getRequest<AuthenticatedRequest>();
  }
}

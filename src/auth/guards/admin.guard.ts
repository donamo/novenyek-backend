import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { AuthenticatedRequest } from '../auth.types';

@Injectable()
export class AdminGuard implements CanActivate {
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

    if (user.isAdmin) {
      return true;
    }

    throw new ForbiddenException('Admin access required');
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

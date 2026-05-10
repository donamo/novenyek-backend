import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticatedRequest } from '../auth.types';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  private readonly logger = new Logger(AuthenticatedGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = this.getRequest(context);

    if (request.isAuthenticated?.() && request.user) {
      return true;
    }

    this.logger.warn(
      `Authentication required: hasCookie=${Boolean(request.headers.cookie)} sessionId=${request.sessionID ?? 'none'} hasUser=${Boolean(request.user)}`,
    );
    throw new UnauthorizedException('Authentication required');
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

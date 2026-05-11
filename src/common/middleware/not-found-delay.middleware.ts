import { Logger } from '@nestjs/common';
import { NextFunction, Request, RequestHandler, Response } from 'express';

const logger = new Logger('NotFoundDelay');

function isAuthenticatedRequest(request: Request): boolean {
  return typeof request.isAuthenticated === 'function' && request.isAuthenticated();
}

export function parseNotFoundDelayMs(value: string | undefined): number {
  if (value === undefined || value.trim() === '') {
    return 0;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.floor(parsed);
}

export function createNotFoundDelayMiddleware(
  delayMs: number,
): RequestHandler {
  if (delayMs <= 0) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const end = res.end.bind(res);

    res.end = ((...args: Parameters<Response['end']>) => {
      if (res.statusCode !== 404 || isAuthenticatedRequest(req)) {
        return end(...args);
      }

      logger.debug(
        `Delaying anonymous 404 response for ${delayMs}ms: ${req.method} ${req.originalUrl}`,
      );
      setTimeout(() => {
        end(...args);
      }, delayMs);

      return res;
    }) as Response['end'];

    next();
  };
}

import { Logger } from '@nestjs/common';
import { NextFunction, Request, RequestHandler, Response } from 'express';

const logger = new Logger('NotFoundDelay');

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

  return (_req: Request, res: Response, next: NextFunction) => {
    const end = res.end.bind(res);

    res.end = ((...args: Parameters<Response['end']>) => {
      if (res.statusCode !== 404) {
        return end(...args);
      }

      logger.debug(
        `Delaying 404 response for ${delayMs}ms: ${_req.method} ${_req.originalUrl}`,
      );
      setTimeout(() => {
        end(...args);
      }, delayMs);

      return res;
    }) as Response['end'];

    next();
  };
}

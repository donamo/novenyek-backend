import { Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const logger = new Logger('HttpRequest');

export function requestLoggingMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const startedAt = Date.now();

  const incomingCookie = request.headers['cookie'] ?? '(none)';
  logger.debug(`>> ${request.method} ${request.originalUrl} | cookie: ${incomingCookie}`);

  response.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const setCookie = response.getHeader('set-cookie');
    const setCookieStr = setCookie
      ? (Array.isArray(setCookie) ? setCookie : [setCookie])
          .map((c) => String(c).split(';')[0])
          .join(', ')
      : '(none)';
    logger.debug(
      `<< ${request.method} ${request.originalUrl} -> ${response.statusCode} ${durationMs}ms | set-cookie: ${setCookieStr}`,
    );
  });

  next();
}

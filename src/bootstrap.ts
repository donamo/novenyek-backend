import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import passport from 'passport';
import { AppModule } from './app.module';
import { createSessionMiddleware } from './auth/session.middleware';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { resolveLogLevels } from './common/logging/log-levels';
import { requestLoggingMiddleware } from './common/logging/request-logging.middleware';

type ExpressLikeApp = {
  set: (setting: string, value: unknown) => void;
};

export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: resolveLogLevels(process.env.LOG_LEVEL),
  });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const logLevels = resolveLogLevels(config.get<string>('LOG_LEVEL'));
  const trustProxy = config.get<string>('TRUST_PROXY') === '1';
  const frontendUrl = config.get<string>('FRONTEND_URL');

  app.useLogger(logLevels);
  logger.log(
    `Logger initialized with LOG_LEVEL=${config.get<string>('LOG_LEVEL', 'log')}`,
  );

  if (trustProxy) {
    const expressApp = app.getHttpAdapter().getInstance() as ExpressLikeApp;
    expressApp.set('trust proxy', 1);
    logger.debug('Express trust proxy enabled');
  }

  app.use(helmet());
  app.use(requestLoggingMiddleware);
  app.use(createSessionMiddleware(config));
  app.use(passport.initialize());
  app.use(passport.session());
  app.enableCors({
    origin: frontendUrl ?? true,
    credentials: true,
  });
  logger.debug(
    `CORS origin configured: ${frontendUrl ?? 'reflect request origin'}`,
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  logger.log(`Backend listening on port ${port}`);
}

import { ConfigService } from '@nestjs/config';
import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
import pg from 'pg';

export function createSessionMiddleware(config: ConfigService) {
  const sessionSecret = config.get<string>('SESSION_SECRET');

  if (!sessionSecret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }

  const ttlSeconds = config.get<number>('SESSION_TTL_SECONDS', 1209600);
  const usePostgresStore = config.get<string>('SESSION_STORE', 'postgres') === 'postgres';
  const PgSession = connectPgSimple(session);

  return session({
    name: 'connect.sid',
    secret: sessionSecret,
    resave: true,
    rolling: true,
    saveUninitialized: false,
    store: usePostgresStore
      ? new PgSession({
          pool: new pg.Pool({
            connectionString: config.get<string>('DATABASE_URL'),
          }),
          tableName: 'session',
          createTableIfMissing: true,
        })
      : undefined,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.get<string>('NODE_ENV') === 'production',
      maxAge: ttlSeconds * 1000,
    },
  });
}

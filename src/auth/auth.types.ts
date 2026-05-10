import { User } from '@prisma/client';
import { Request } from 'express';
import session from 'express-session';

export type AuthenticatedUser = Pick<
  User,
  'id' | 'email' | 'displayName' | 'isEnabled'
> & {
  isAdmin: boolean;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
  session: session.Session & Partial<session.SessionData>;
  sessionID?: string;
  logout: (callback: (error?: Error) => void) => void;
  isAuthenticated: () => boolean;
};

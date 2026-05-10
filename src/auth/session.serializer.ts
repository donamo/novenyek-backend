import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthenticatedUser } from './auth.types';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly authService: AuthService) {
    super();
  }

  serializeUser(user: AuthenticatedUser, done: (error: Error | null, id?: string) => void): void {
    done(null, user.id);
  }

  async deserializeUser(
    id: string,
    done: (error: Error | null, user?: AuthenticatedUser | false) => void,
  ): Promise<void> {
    try {
      const user = await this.authService.findUserById(id);
      done(null, user ?? false);
    } catch (error) {
      done(error as Error);
    }
  }
}

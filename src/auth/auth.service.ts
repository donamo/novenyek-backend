import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from './auth.types';

export type GoogleProfileInput = {
  googleSubject: string;
  email: string;
  displayName?: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findUserById(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      this.logger.debug(`Session user not found: ${id}`);
      return null;
    }

    return this.toAuthenticatedUser(user);
  }

  async findOrCreateGoogleUser(
    input: GoogleProfileInput,
  ): Promise<AuthenticatedUser> {
    const existingUser = await this.prisma.user.findUnique({
      where: { googleSubject: input.googleSubject },
      select: { id: true },
    });
    const user = await this.prisma.user.upsert({
      where: { googleSubject: input.googleSubject },
      create: {
        googleSubject: input.googleSubject,
        email: input.email,
        displayName: input.displayName,
      },
      update: {
        email: input.email,
        displayName: input.displayName,
      },
    });

    if (existingUser) {
      this.logger.debug(`Google user session refreshed: ${user.id}`);
    } else {
      this.logger.log(`New Google user created and awaiting enablement: ${user.id}`);
    }

    return this.toAuthenticatedUser(user);
  }

  toAuthenticatedUser(user: User): AuthenticatedUser {
    const isAdmin = this.isAdminEmail(user.email);
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isEnabled: user.isEnabled || isAdmin,
      isAdmin,
    };
  }

  isAdminEmail(email: string): boolean {
    const adminEmail = this.config.get<string>('ADMIN_EMAIL');
    return Boolean(adminEmail && adminEmail.toLowerCase() === email.toLowerCase());
  }
}

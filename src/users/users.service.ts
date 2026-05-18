import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReadOnlyPrismaService } from '../prisma/read-only-prisma.service';
import { UpdateUserEnabledInput } from './dto/update-user-enabled.input';
import { UserModel } from './models/user.model';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readOnlyPrisma: ReadOnlyPrismaService,
    private readonly authService: AuthService,
  ) {}

  async findAll(): Promise<UserModel[]> {
    const users = await this.readOnlyPrisma.user.findMany({
      orderBy: [{ email: 'asc' }],
    });

    return users.map((user) => this.authService.toAuthenticatedUser(user));
  }

  async updateEnabled(input: UpdateUserEnabledInput): Promise<UserModel> {
    const user = await this.prisma.user.findUnique({ where: { id: input.id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: input.id },
      data: { isEnabled: input.isEnabled },
    });

    return this.authService.toAuthenticatedUser(updated);
  }
}

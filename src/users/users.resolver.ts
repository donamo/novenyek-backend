import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { UpdateUserEnabledInput } from './dto/update-user-enabled.input';
import { UserModel } from './models/user.model';
import { UsersService } from './users.service';

@Resolver(() => UserModel)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserModel)
  @UseGuards(AuthenticatedGuard)
  me(@CurrentUser() user: AuthenticatedUser): UserModel {
    return user;
  }

  @Query(() => [UserModel])
  @UseGuards(AdminGuard)
  users(): Promise<UserModel[]> {
    return this.usersService.findAll();
  }

  @Mutation(() => UserModel)
  @UseGuards(AdminGuard)
  updateUserEnabled(
    @Args('input') input: UpdateUserEnabledInput,
  ): Promise<UserModel> {
    return this.usersService.updateEnabled(input);
  }
}

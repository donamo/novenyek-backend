import { Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { EnabledUserGuard } from '../auth/guards/enabled-user.guard';
import { DashboardModel } from './models/dashboard.model';
import { DashboardService } from './dashboard.service';

@Resolver(() => DashboardModel)
@UseGuards(EnabledUserGuard)
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => DashboardModel)
  dashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getDashboard(user.id);
  }
}

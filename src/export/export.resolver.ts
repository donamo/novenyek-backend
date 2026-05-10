import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { EnabledUserGuard } from '../auth/guards/enabled-user.guard';
import { ExportService } from './export.service';

@Resolver()
@UseGuards(EnabledUserGuard)
export class ExportResolver {
  constructor(private readonly exportService: ExportService) {}

  @Query(() => String)
  plantExportJson(
    @CurrentUser() user: AuthenticatedUser,
    @Args('plantId', { type: () => ID }) plantId: string,
  ) {
    return this.exportService.exportPlantJsonString(user.id, plantId);
  }

  @Query(() => String)
  plantExportMarkdown(
    @CurrentUser() user: AuthenticatedUser,
    @Args('plantId', { type: () => ID }) plantId: string,
  ) {
    return this.exportService.exportPlantMarkdown(user.id, plantId);
  }
}

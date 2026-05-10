import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { EnabledUserGuard } from '../auth/guards/enabled-user.guard';
import { DeleteResponse } from '../common/graphql/models/delete-response.model';
import { CreatePlantStatusReportDto } from './dto/create-plant-status-report.dto';
import { UpdatePlantStatusReportDto } from './dto/update-plant-status-report.dto';
import { PlantStatusReportModel } from './models/plant-status-report.model';
import { PlantStatusReportsService } from './plant-status-reports.service';

@Resolver(() => PlantStatusReportModel)
@UseGuards(EnabledUserGuard)
export class PlantStatusReportsResolver {
  constructor(private readonly statusReportsService: PlantStatusReportsService) {}

  @Query(() => [PlantStatusReportModel])
  plantStatusReports(
    @CurrentUser() user: AuthenticatedUser,
    @Args('plantId', { type: () => ID }) plantId: string,
  ) {
    return this.statusReportsService.findByPlant(user.id, plantId);
  }

  @Query(() => PlantStatusReportModel)
  plantStatusReport(
    @CurrentUser() user: AuthenticatedUser,
    @Args('plantId', { type: () => ID }) plantId: string,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.statusReportsService.findOne(user.id, plantId, id);
  }

  @Mutation(() => PlantStatusReportModel)
  createPlantStatusReport(
    @CurrentUser() user: AuthenticatedUser,
    @Args('plantId', { type: () => ID }) plantId: string,
    @Args('input') input: CreatePlantStatusReportDto,
  ) {
    return this.statusReportsService.create(user.id, plantId, input);
  }

  @Mutation(() => PlantStatusReportModel)
  updatePlantStatusReport(
    @CurrentUser() user: AuthenticatedUser,
    @Args('plantId', { type: () => ID }) plantId: string,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdatePlantStatusReportDto,
  ) {
    return this.statusReportsService.update(user.id, plantId, id, input);
  }

  @Mutation(() => DeleteResponse)
  deletePlantStatusReport(
    @CurrentUser() user: AuthenticatedUser,
    @Args('plantId', { type: () => ID }) plantId: string,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.statusReportsService.remove(user.id, plantId, id);
  }
}

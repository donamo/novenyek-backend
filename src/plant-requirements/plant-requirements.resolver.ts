import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { EnabledUserGuard } from '../auth/guards/enabled-user.guard';
import { UpsertPlantRequirementDto } from './dto/upsert-plant-requirement.dto';
import { PlantRequirementModel } from './models/plant-requirement.model';
import { PlantRequirementsService } from './plant-requirements.service';

@Resolver(() => PlantRequirementModel)
@UseGuards(EnabledUserGuard)
export class PlantRequirementsResolver {
  constructor(private readonly plantRequirementsService: PlantRequirementsService) {}

  @Query(() => PlantRequirementModel, { nullable: true })
  plantRequirement(
    @CurrentUser() user: AuthenticatedUser,
    @Args('plantId', { type: () => ID }) plantId: string,
  ) {
    return this.plantRequirementsService.findByPlant(user.id, plantId);
  }

  @Mutation(() => PlantRequirementModel)
  upsertPlantRequirement(
    @CurrentUser() user: AuthenticatedUser,
    @Args('plantId', { type: () => ID }) plantId: string,
    @Args('input') input: UpsertPlantRequirementDto,
  ) {
    return this.plantRequirementsService.upsert(user.id, plantId, input);
  }
}

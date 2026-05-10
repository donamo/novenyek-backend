import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { EnabledUserGuard } from '../auth/guards/enabled-user.guard';
import { DeleteResponse } from '../common/graphql/models/delete-response.model';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';
import { PlantModel } from './models/plant.model';
import { PlantsService } from './plants.service';

@Resolver(() => PlantModel)
@UseGuards(EnabledUserGuard)
export class PlantsResolver {
  constructor(private readonly plantsService: PlantsService) {}

  @Query(() => [PlantModel])
  plants(@CurrentUser() user: AuthenticatedUser) {
    return this.plantsService.findAll(user.id);
  }

  @Query(() => PlantModel)
  plant(@CurrentUser() user: AuthenticatedUser, @Args('id', { type: () => ID }) id: string) {
    return this.plantsService.findOne(user.id, id);
  }

  @Mutation(() => PlantModel)
  createPlant(@CurrentUser() user: AuthenticatedUser, @Args('input') input: CreatePlantDto) {
    return this.plantsService.create(user.id, input);
  }

  @Mutation(() => PlantModel)
  updatePlant(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdatePlantDto,
  ) {
    return this.plantsService.update(user.id, id, input);
  }

  @Mutation(() => DeleteResponse)
  deletePlant(@CurrentUser() user: AuthenticatedUser, @Args('id', { type: () => ID }) id: string) {
    return this.plantsService.remove(user.id, id);
  }
}

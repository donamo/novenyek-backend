import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { EnabledUserGuard } from '../auth/guards/enabled-user.guard';
import { DeleteResponse } from '../common/graphql/models/delete-response.model';
import { CreatePlantEventDto } from './dto/create-plant-event.dto';
import { UpdatePlantEventDto } from './dto/update-plant-event.dto';
import { PlantEventModel } from './models/plant-event.model';
import { PlantEventsService } from './plant-events.service';

@Resolver(() => PlantEventModel)
@UseGuards(EnabledUserGuard)
export class PlantEventsResolver {
  constructor(private readonly plantEventsService: PlantEventsService) {}

  @Query(() => [PlantEventModel])
  plantEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Args('plantId', { type: () => ID }) plantId: string,
  ) {
    return this.plantEventsService.findByPlant(user.id, plantId);
  }

  @Mutation(() => PlantEventModel)
  createPlantEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Args('plantId', { type: () => ID }) plantId: string,
    @Args('input') input: CreatePlantEventDto,
  ) {
    return this.plantEventsService.create(user.id, plantId, input);
  }

  @Mutation(() => PlantEventModel)
  updatePlantEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Args('plantId', { type: () => ID }) plantId: string,
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('input') input: UpdatePlantEventDto,
  ) {
    return this.plantEventsService.update(user.id, plantId, eventId, input);
  }

  @Mutation(() => DeleteResponse)
  deletePlantEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Args('plantId', { type: () => ID }) plantId: string,
    @Args('eventId', { type: () => ID }) eventId: string,
  ) {
    return this.plantEventsService.remove(user.id, plantId, eventId);
  }
}

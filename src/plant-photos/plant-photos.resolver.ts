import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { EnabledUserGuard } from '../auth/guards/enabled-user.guard';
import { DeleteResponse } from '../common/graphql/models/delete-response.model';
import { CreatePlantPhotoFromBase64Input } from './dto/create-plant-photo-from-base64.input';
import { PlantPhotoModel } from './models/plant-photo.model';
import { PlantPhotosService } from './plant-photos.service';

@Resolver(() => PlantPhotoModel)
@UseGuards(EnabledUserGuard)
export class PlantPhotosResolver {
  constructor(private readonly plantPhotosService: PlantPhotosService) {}

  @Query(() => [PlantPhotoModel])
  plantPhotos(
    @CurrentUser() user: AuthenticatedUser,
    @Args('plantId', { type: () => ID }) plantId: string,
  ) {
    return this.plantPhotosService.findByPlant(user.id, plantId);
  }

  @Query(() => [PlantPhotoModel])
  plantStatusReportPhotos(
    @CurrentUser() user: AuthenticatedUser,
    @Args('plantId', { type: () => ID }) plantId: string,
    @Args('statusReportId', { type: () => ID }) statusReportId: string,
  ) {
    return this.plantPhotosService.findByStatusReport(
      user.id,
      plantId,
      statusReportId,
    );
  }

  @Mutation(() => PlantPhotoModel)
  createPlantPhotoFromBase64(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: CreatePlantPhotoFromBase64Input,
  ) {
    return this.plantPhotosService.createFromBase64(user.id, input);
  }

  @Mutation(() => DeleteResponse)
  deletePlantPhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Args('photoId', { type: () => ID }) photoId: string,
  ) {
    return this.plantPhotosService.remove(user.id, photoId);
  }
}

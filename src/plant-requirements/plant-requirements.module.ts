import { Module } from '@nestjs/common';
import { PlantsModule } from '../plants/plants.module';
import { PlantRequirementsResolver } from './plant-requirements.resolver';
import { PlantRequirementsService } from './plant-requirements.service';

@Module({
  imports: [PlantsModule],
  providers: [PlantRequirementsResolver, PlantRequirementsService],
})
export class PlantRequirementsModule {}

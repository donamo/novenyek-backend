import { Module } from '@nestjs/common';
import { PlantsModule } from '../plants/plants.module';
import { PlantEventsResolver } from './plant-events.resolver';
import { PlantEventsService } from './plant-events.service';

@Module({
  imports: [PlantsModule],
  providers: [PlantEventsResolver, PlantEventsService],
  exports: [PlantEventsService],
})
export class PlantEventsModule {}

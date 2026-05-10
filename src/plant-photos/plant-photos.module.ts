import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { PlantEventsModule } from '../plant-events/plant-events.module';
import { PlantStatusReportsModule } from '../plant-status-reports/plant-status-reports.module';
import { PlantsModule } from '../plants/plants.module';
import { PlantPhotosResolver } from './plant-photos.resolver';
import { PlantPhotosService } from './plant-photos.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({}),
    PlantsModule,
    PlantStatusReportsModule,
    PlantEventsModule,
  ],
  providers: [PlantPhotosResolver, PlantPhotosService],
  exports: [PlantPhotosService],
})
export class PlantPhotosModule {}

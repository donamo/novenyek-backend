import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { PlantEventsModule } from '../plant-events/plant-events.module';
import { PlantStatusReportsModule } from '../plant-status-reports/plant-status-reports.module';
import { PlantsModule } from '../plants/plants.module';
import { PlantPhotosController } from './plant-photos.controller';
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
  controllers: [PlantPhotosController],
  providers: [PlantPhotosResolver, PlantPhotosService],
  exports: [PlantPhotosService],
})
export class PlantPhotosModule {}

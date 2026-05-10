import { Module } from '@nestjs/common';
import { PlantsModule } from '../plants/plants.module';
import { PlantStatusReportsResolver } from './plant-status-reports.resolver';
import { PlantStatusReportsService } from './plant-status-reports.service';

@Module({
  imports: [PlantsModule],
  providers: [PlantStatusReportsResolver, PlantStatusReportsService],
  exports: [PlantStatusReportsService],
})
export class PlantStatusReportsModule {}

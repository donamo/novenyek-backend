import { Module } from '@nestjs/common';
import { PlantEventsModule } from '../plant-events/plant-events.module';
import { PlantPhotosModule } from '../plant-photos/plant-photos.module';
import { PlantStatusReportsModule } from '../plant-status-reports/plant-status-reports.module';
import { PlantsModule } from '../plants/plants.module';
import { AiAnalysisResolver } from './ai-analysis.resolver';
import { AiAnalysisService } from './ai-analysis.service';
import { MockPlantAnalysisProvider } from './providers/mock-plant-analysis.provider';

@Module({
  imports: [
    PlantsModule,
    PlantPhotosModule,
    PlantStatusReportsModule,
    PlantEventsModule,
  ],
  providers: [AiAnalysisResolver, AiAnalysisService, MockPlantAnalysisProvider],
  exports: [AiAnalysisService],
})
export class AiAnalysisModule {}

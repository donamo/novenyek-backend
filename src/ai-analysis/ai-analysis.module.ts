import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlantEventsModule } from '../plant-events/plant-events.module';
import { PlantPhotosModule } from '../plant-photos/plant-photos.module';
import { PlantStatusReportsModule } from '../plant-status-reports/plant-status-reports.module';
import { PlantsModule } from '../plants/plants.module';
import { AiAnalysisResolver } from './ai-analysis.resolver';
import { AiAnalysisService } from './ai-analysis.service';
import { MockPlantAnalysisProvider } from './providers/mock-plant-analysis.provider';
import { OpenAiPlantAnalysisProvider } from './providers/openai-plant-analysis.provider';

@Module({
  imports: [
    ConfigModule,
    PlantsModule,
    PlantPhotosModule,
    PlantStatusReportsModule,
    PlantEventsModule,
  ],
  providers: [
    AiAnalysisResolver,
    AiAnalysisService,
    MockPlantAnalysisProvider,
    OpenAiPlantAnalysisProvider,
  ],
  exports: [AiAnalysisService],
})
export class AiAnalysisModule {}

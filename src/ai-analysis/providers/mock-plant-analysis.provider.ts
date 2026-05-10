import { Injectable } from '@nestjs/common';
import { OverallStatus } from '@prisma/client';
import {
  AiPlantAnalysisProvider,
  AnalyzePlantPhotosInput,
  AnalyzePlantPhotosResult,
} from '../ai-analysis.types';

@Injectable()
export class MockPlantAnalysisProvider implements AiPlantAnalysisProvider {
  analyzePlantPhotos(
    input: AnalyzePlantPhotosInput,
  ): Promise<AnalyzePlantPhotosResult> {
    const photoCount = input.photoPaths.length;

    return Promise.resolve({
      overallStatus: OverallStatus.unknown,
      confidence: 'low',
      observations: [
        `Mock elemzés ${photoCount} fotó alapján.`,
        'Valódi AI provider még nincs bekötve.',
      ],
      possibleCauses: ['A mock provider nem állapít meg okot.'],
      recommendations: [
        'Ellenőrizd a levelek, a föld és a fényviszonyok állapotát.',
        'Valódi AI elemzéshez állíts be OpenAI vagy Gemini providert.',
      ],
      riskLevel: 'low',
      needsHumanReview: false,
      shortSummary: 'Mock AI elemzés készült, diagnózis nélkül.',
    });
  }
}

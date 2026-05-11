import { Injectable } from '@nestjs/common';
import { OverallStatus, PlantSize } from '@prisma/client';
import {
  AiPlantAnalysisProvider,
  AnalyzePlantPhotosInput,
  AnalyzePlantPhotosResult,
  IdentifyPlantFromPhotoInput,
  IdentifyPlantFromPhotoResult,
} from '../ai-analysis.types';

@Injectable()
export class MockPlantAnalysisProvider implements AiPlantAnalysisProvider {
  analyzePlantPhotos(
    input: AnalyzePlantPhotosInput,
  ): Promise<AnalyzePlantPhotosResult> {
    const photoCount = input.photoDataUrls.length;

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

  identifyPlantFromPhoto(
    input: IdentifyPlantFromPhotoInput,
  ): Promise<IdentifyPlantFromPhotoResult> {
    void input;

    return Promise.resolve({
      commonName: 'Szobafikusz',
      species: 'Ficus elastica',
      category: 'szobanoveny',
      size: PlantSize.medium,
      potSizeCm: 21,
      careProfile: {
        lightNeed: 'Vilagos hely, eros szort feny.',
        waterNeed:
          'Ket locsolas kozott a talaj felso reteget hagyd enyhen kiszaradni.',
        humidityNeed: 'Kozepes vagy enyhen magas paratartalom.',
        temperatureNeed: '18-27 °C kozott idealis.',
        soilNeed: 'Laza, jo vizelvezetesu szobanoveny-fold.',
        fertilizingNeed: 'Tavasztol oszig 2-4 hetente.',
        repottingFrequency: '1-2 evente tavasszal.',
        commonProblems: 'Tulontozes, fenyhiany, takacsatka.',
        toxicity: 'Enyhen mergezo haziallatoknak.',
      },
      confidence: 'low',
      needsHumanReview: true,
      shortSummary:
        'Mock AI növényfelismerés készült. A faj becslés, megerősítés javasolt.',
    });
  }
}

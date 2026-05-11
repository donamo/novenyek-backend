import { OverallStatus, PlantSize } from '@prisma/client';

export type AiRiskLevel = 'low' | 'medium' | 'high';
export type AiLanguage = 'hu';

export type AnalyzePlantPhotosInput = {
  plantId: string;
  plantName?: string;
  species?: string | null;
  room?: {
    name: string;
    orientation?: string | null;
    lightLevel?: string | null;
  } | null;
  statusReportId?: string;
  photoDataUrls: string[];
  language: AiLanguage;
};

export type AnalyzePlantPhotosResult = {
  overallStatus: OverallStatus;
  confidence: 'low' | 'medium' | 'high';
  observations: string[];
  possibleCauses: string[];
  recommendations: string[];
  riskLevel: AiRiskLevel;
  needsHumanReview: boolean;
  shortSummary: string;
};

export type IdentifyPlantFromPhotoInput = {
  photoDataUrl: string;
  language: AiLanguage;
};

export type IdentifyPlantFromPhotoResult = {
  commonName?: string;
  species?: string;
  category?: string;
  size?: PlantSize;
  potSizeCm?: number;
  careProfile: {
    lightNeed?: string;
    waterNeed?: string;
    humidityNeed?: string;
    temperatureNeed?: string;
    soilNeed?: string;
    fertilizingNeed?: string;
    repottingFrequency?: string;
    commonProblems?: string;
    toxicity?: string;
  };
  confidence: 'low' | 'medium' | 'high';
  needsHumanReview: boolean;
  shortSummary: string;
};

export interface AiPlantAnalysisProvider {
  analyzePlantPhotos(
    input: AnalyzePlantPhotosInput,
  ): Promise<AnalyzePlantPhotosResult>;

  identifyPlantFromPhoto(
    input: IdentifyPlantFromPhotoInput,
  ): Promise<IdentifyPlantFromPhotoResult>;
}

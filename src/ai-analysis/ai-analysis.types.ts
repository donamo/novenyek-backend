import { OverallStatus } from '@prisma/client';

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
  photoPaths: string[];
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

export interface AiPlantAnalysisProvider {
  analyzePlantPhotos(
    input: AnalyzePlantPhotosInput,
  ): Promise<AnalyzePlantPhotosResult>;
}

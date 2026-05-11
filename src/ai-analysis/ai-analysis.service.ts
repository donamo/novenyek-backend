import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiAnalysis, AiProvider, PlantEventType, Prisma } from '@prisma/client';
import { PlantEventsService } from '../plant-events/plant-events.service';
import { PlantPhotosService } from '../plant-photos/plant-photos.service';
import { PlantStatusReportsService } from '../plant-status-reports/plant-status-reports.service';
import { PlantsService } from '../plants/plants.service';
import { CreatePlantFromPhotoInput } from '../plants/dto/create-plant-from-photo.input';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyzePlantPhotosResult } from './ai-analysis.types';
import { CreateAiAnalysisDto } from './dto/create-ai-analysis.dto';
import { MockPlantAnalysisProvider } from './providers/mock-plant-analysis.provider';
import { OpenAiPlantAnalysisProvider } from './providers/openai-plant-analysis.provider';
import { AiAnalysisModel } from './models/ai-analysis.model';
import { AiPlantAnalysisProvider } from './ai-analysis.types';
import { resolveAiModel } from './ai-model-resolver';

const PROMPT_VERSION = 'plant-analysis-v1';

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly plantsService: PlantsService,
    private readonly plantPhotosService: PlantPhotosService,
    private readonly statusReportsService: PlantStatusReportsService,
    private readonly plantEventsService: PlantEventsService,
    private readonly mockProvider: MockPlantAnalysisProvider,
    private readonly openAiProvider: OpenAiPlantAnalysisProvider,
  ) {}

  async create(ownerUserId: string, plantId: string, input: CreateAiAnalysisDto) {
    const provider = input.provider ?? this.getConfiguredProvider();
    const aiProvider = this.getAnalysisProvider(provider);

    await this.assertLimits(ownerUserId, input.photoIds.length);
    const plant = await this.prisma.plant.findFirst({
      where: { id: plantId, ownerUserId },
      include: { room: true },
    });

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }

    if (input.statusReportId) {
      await this.statusReportsService.ensurePlantReport(
        ownerUserId,
        plantId,
        input.statusReportId,
      );
    }

    const photos = await this.plantPhotosService.findManyForAnalysis(
      ownerUserId,
      plantId,
      input.photoIds,
    );

    const result = await aiProvider.analyzePlantPhotos({
      plantId,
      plantName: plant.name,
      species: plant.species,
      room: plant.room
        ? {
            name: plant.room.name,
            orientation: plant.room.orientation,
            lightLevel: plant.room.lightLevel,
          }
        : null,
      statusReportId: input.statusReportId,
      photoPaths: photos.map((photo) => photo.filePath),
      language: input.language ?? 'hu',
    });

    const analysis = await this.persistAnalysis({
      plantId,
      ownerUserId,
      statusReportId: input.statusReportId,
      provider,
      model: resolveAiModel(this.config, provider),
      photoIds: input.photoIds,
      result,
    });

    if (input.statusReportId) {
      await this.statusReportsService.updateAiSummary(
        ownerUserId,
        plantId,
        input.statusReportId,
        {
          aiSummary: result.shortSummary,
          aiRecommendations: result.recommendations.join('\n'),
        },
      );
    }

    await this.plantEventsService.createSystemEvent({
      ownerUserId,
      plantId,
      type: PlantEventType.ai_analysis,
      title: 'AI állapotelemzés készült',
      description: result.shortSummary,
    });

    this.logger.debug(
      `AI analysis created: ${analysis.id} plant=${plantId} provider=${provider}`,
    );

    return this.toModel(analysis);
  }

  async createPlantFromPhoto(
    ownerUserId: string,
    input: CreatePlantFromPhotoInput,
  ) {
    const provider = this.getConfiguredProvider();
    const aiProvider = this.getAnalysisProvider(provider);

    const fallbackName = input.name?.trim() || 'Azonositatlan noveny';
    let plantId: string | null = null;
    let photoId: string | null = null;

    try {
      const plant = await this.plantsService.create(ownerUserId, {
        name: fallbackName,
        nickname: input.nickname,
        roomId: input.roomId,
        locationDescription: input.locationDescription,
        acquiredAt: input.acquiredAt,
        acquiredFrom: input.acquiredFrom,
        status: input.status,
        notes: input.notes,
      });
      plantId = plant.id;

      const photo = await this.plantPhotosService.createFromBase64(ownerUserId, {
        plantId,
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
        originalFilename: input.originalFilename,
        takenAt: input.acquiredAt,
        caption: input.caption,
      });
      photoId = photo.id;

      const identification = await aiProvider.identifyPlantFromPhoto({
        photoPath: photo.filePath,
        language: 'hu',
      });

      const updatedPlant = await this.plantsService.update(ownerUserId, plantId, {
        name:
          input.name?.trim() ||
          identification.commonName ||
          identification.species ||
          fallbackName,
        nickname: input.nickname,
        species: input.species ?? identification.species,
        category: input.category ?? identification.category,
        size: input.size ?? identification.size,
        potSizeCm: input.potSizeCm,
        roomId: input.roomId,
        locationDescription: input.locationDescription,
        acquiredAt: input.acquiredAt,
        acquiredFrom: input.acquiredFrom,
        status: input.status,
        notes: this.mergeNotes(input.notes, identification.shortSummary),
      });

      this.logger.debug(
        `Plant created from photo: ${updatedPlant.id} provider=${provider} confidence=${identification.confidence}`,
      );

      return updatedPlant;
    } catch (error) {
      if (photoId) {
        await this.safeRemovePhoto(ownerUserId, photoId);
      }

      if (plantId) {
        await this.safeRemovePlant(ownerUserId, plantId);
      }

      throw error;
    }
  }

  async findByPlant(ownerUserId: string, plantId: string) {
    await this.plantsService.ensureExists(ownerUserId, plantId);
    const analyses = await this.prisma.aiAnalysis.findMany({
      where: { ownerUserId, plantId },
      orderBy: { createdAt: 'desc' },
    });

    return analyses.map((analysis) => this.toModel(analysis));
  }

  async findOne(ownerUserId: string, id: string) {
    const analysis = await this.prisma.aiAnalysis.findFirst({
      where: { id, ownerUserId },
    });

    if (!analysis) {
      throw new NotFoundException('AI analysis not found');
    }

    return this.toModel(analysis);
  }

  private async assertLimits(
    ownerUserId: string,
    photoCount: number,
  ): Promise<void> {
    const maxPhotos = this.config.get<number>('AI_MAX_PHOTOS_PER_ANALYSIS', 3);
    const monthlyLimit = this.config.get<number>('AI_MONTHLY_IMAGE_LIMIT', 30);

    if (photoCount > maxPhotos) {
      throw new BadRequestException(
        `Maximum ${maxPhotos} photos are allowed per analysis`,
      );
    }

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const analysesThisMonth = await this.prisma.aiAnalysis.findMany({
      where: { ownerUserId, createdAt: { gte: monthStart } },
      select: { inputPhotoIds: true },
    });
    const usedPhotos = analysesThisMonth.reduce((sum, analysis) => {
      if (Array.isArray(analysis.inputPhotoIds)) {
        return sum + analysis.inputPhotoIds.length;
      }

      return sum;
    }, 0);

    if (usedPhotos + photoCount > monthlyLimit) {
      throw new BadRequestException('Monthly AI image limit exceeded');
    }
  }

  private persistAnalysis(input: {
    plantId: string;
    ownerUserId: string;
    statusReportId?: string;
    provider: AiProvider;
    model: string;
    photoIds: string[];
    result: AnalyzePlantPhotosResult;
  }) {
    return this.prisma.aiAnalysis.create({
      data: {
        plantId: input.plantId,
        ownerUserId: input.ownerUserId,
        statusReportId: input.statusReportId,
        provider: input.provider,
        model: input.model,
        promptVersion: PROMPT_VERSION,
        inputPhotoIds: input.photoIds,
        rawResponse: input.result,
        summary: input.result.shortSummary,
        recommendations: input.result.recommendations,
        confidence: input.result.confidence,
      },
    });
  }

  private getConfiguredProvider(): AiProvider {
    const provider = this.config.get<string>('AI_PROVIDER', 'mock');

    if (provider in AiProvider) {
      return provider as AiProvider;
    }

    return AiProvider.mock;
  }

  private getAnalysisProvider(provider: AiProvider): AiPlantAnalysisProvider {
    if (provider === AiProvider.mock) {
      return this.mockProvider;
    }

    if (provider === AiProvider.openai) {
      return this.openAiProvider;
    }

    throw new BadRequestException(
      `AI provider ${provider} is not implemented in this backend step`,
    );
  }

  private mergeNotes(
    manualNotes: string | undefined,
    aiSummary: string,
  ): string | undefined {
    const normalizedManual = manualNotes?.trim();

    if (!normalizedManual) {
      return aiSummary;
    }

    return `${normalizedManual}\n\nAI felismeres: ${aiSummary}`;
  }

  private async safeRemovePhoto(
    ownerUserId: string,
    photoId: string,
  ): Promise<void> {
    try {
      await this.plantPhotosService.remove(ownerUserId, photoId);
    } catch (cleanupError) {
      this.logger.warn(
        `Failed to cleanup photo ${photoId}: ${String(cleanupError)}`,
      );
    }
  }

  private async safeRemovePlant(
    ownerUserId: string,
    plantId: string,
  ): Promise<void> {
    try {
      await this.plantsService.remove(ownerUserId, plantId);
    } catch (cleanupError) {
      this.logger.warn(
        `Failed to cleanup plant ${plantId}: ${String(cleanupError)}`,
      );
    }
  }

  toModel(analysis: AiAnalysis): AiAnalysisModel {
    return {
      ...analysis,
      inputPhotoIds: this.jsonStringArray(analysis.inputPhotoIds),
      rawResponseJson: JSON.stringify(analysis.rawResponse),
      recommendations: this.jsonStringArray(analysis.recommendations),
    };
  }

  private jsonStringArray(value: Prisma.JsonValue): string[] {
    if (Array.isArray(value)) {
      return value.map((item) =>
        typeof item === 'string' ? item : JSON.stringify(item),
      );
    }

    return [];
  }
}

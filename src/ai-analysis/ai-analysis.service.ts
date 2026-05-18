import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiAnalysis,
  AiProvider,
  PlantEventType,
  PlantStatus,
  Prisma,
} from '@prisma/client';
import { PlantEventsService } from '../plant-events/plant-events.service';
import { PlantPhotosService } from '../plant-photos/plant-photos.service';
import { PlantRequirementsService } from '../plant-requirements/plant-requirements.service';
import { PlantStatusReportsService } from '../plant-status-reports/plant-status-reports.service';
import { PlantsService } from '../plants/plants.service';
import { CreatePlantFromPhotoInput } from '../plants/dto/create-plant-from-photo.input';
import { PrismaService } from '../prisma/prisma.service';
import { ReadOnlyPrismaService } from '../prisma/read-only-prisma.service';
import { RoomsService } from '../rooms/rooms.service';
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
    private readonly readOnlyPrisma: ReadOnlyPrismaService,
    private readonly config: ConfigService,
    private readonly plantsService: PlantsService,
    private readonly roomsService: RoomsService,
    private readonly plantPhotosService: PlantPhotosService,
    private readonly plantRequirementsService: PlantRequirementsService,
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
      photoDataUrls: await Promise.all(
        photos.map((photo) => this.plantPhotosService.toImageDataUrl(photo)),
      ),
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
    const model = resolveAiModel(this.config, provider);

    const acquiredAt = new Date();
    const room = input.roomId
      ? await this.roomsService.findOneOnPrimary(ownerUserId, input.roomId)
      : null;
    let plantId: string | null = null;
    let photoId: string | null = null;

    try {
      const plant = await this.plantsService.create(ownerUserId, {
        name: 'Azonositatlan noveny',
        roomId: room?.id,
        acquiredAt,
        status: PlantStatus.active,
      });
      plantId = plant.id;

      const photo = await this.plantPhotosService.createFromBase64(ownerUserId, {
        plantId,
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
        originalFilename: input.originalFilename,
        takenAt: acquiredAt,
        caption: input.caption,
      });
      photoId = photo.id;
      const photoDataUrl = await this.plantPhotosService.toImageDataUrl(photo);
      const roomContext = room
        ? {
            name: room.name,
            orientation: room.orientation,
            lightLevel: room.lightLevel,
            humidityLevel: room.humidityLevel,
            averageTemperature: room.averageTemperature,
            notes: room.notes,
          }
        : null;

      const identification = await aiProvider.identifyPlantFromPhoto({
        photoDataUrl,
        room: roomContext,
        language: 'hu',
      });
      const generatedName = await this.generateDefaultPlantName(
        ownerUserId,
        identification.species ||
          identification.commonName ||
          'Azonositatlan noveny',
      );

      const updatedPlant = await this.plantsService.update(ownerUserId, plantId, {
        name: generatedName,
        species: identification.species,
        category: identification.category,
        size: identification.size,
        potSizeCm: identification.potSizeCm,
        roomId: room?.id,
        acquiredAt,
        status: PlantStatus.active,
        notes: identification.shortSummary,
      });
      await this.plantRequirementsService.upsert(ownerUserId, plantId, {
        ...identification.careProfile,
        source: `${provider}:${model}`,
      });
      const initialStatusReport = await this.statusReportsService.create(
        ownerUserId,
        plantId,
        {
          reportMonth: this.toReportMonth(acquiredAt),
        },
      );
      await this.prisma.plantPhoto.update({
        where: { id: photoId },
        data: { statusReportId: initialStatusReport.id },
      });
      const initialAnalysis = await aiProvider.analyzePlantPhotos({
        plantId,
        plantName: updatedPlant.name,
        species: updatedPlant.species,
        room: roomContext
          ? {
              name: roomContext.name,
              orientation: roomContext.orientation,
              lightLevel: roomContext.lightLevel,
            }
          : null,
        statusReportId: initialStatusReport.id,
        photoDataUrls: [photoDataUrl],
        language: 'hu',
      });
      await this.persistAnalysis({
        plantId,
        ownerUserId,
        statusReportId: initialStatusReport.id,
        provider,
        model,
        photoIds: [photoId],
        result: initialAnalysis,
      });
      await this.statusReportsService.update(ownerUserId, plantId, initialStatusReport.id, {
        overallStatus: initialAnalysis.overallStatus,
        notes: initialAnalysis.observations.join('\n'),
        aiSummary: initialAnalysis.shortSummary,
        aiRecommendations: initialAnalysis.recommendations.join('\n'),
      });
      await this.plantEventsService.createSystemEvent({
        ownerUserId,
        plantId,
        type: PlantEventType.ai_analysis,
        title: 'Kiindulo allapot AI elemzessel rogzitve',
        description: initialAnalysis.shortSummary,
        eventDate: acquiredAt,
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
    await this.plantsService.ensureExistsReadOnly(ownerUserId, plantId);
    const analyses = await this.readOnlyPrisma.aiAnalysis.findMany({
      where: { ownerUserId, plantId },
      orderBy: { createdAt: 'desc' },
    });

    return analyses.map((analysis) => this.toModel(analysis));
  }

  async findOne(ownerUserId: string, id: string) {
    const analysis = await this.readOnlyPrisma.aiAnalysis.findFirst({
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

  private async generateDefaultPlantName(
    ownerUserId: string,
    baseName: string,
  ): Promise<string> {
    const normalizedBase = baseName.trim() || 'Azonositatlan noveny';
    const existingPlants = await this.prisma.plant.findMany({
      where: {
        ownerUserId,
        name: {
          startsWith: normalizedBase,
        },
      },
      select: { name: true },
    });
    const usedNames = new Set(existingPlants.map((plant) => plant.name));

    if (!usedNames.has(normalizedBase)) {
      return normalizedBase;
    }

    let suffix = 1;
    while (usedNames.has(`${normalizedBase}-${suffix}`)) {
      suffix += 1;
    }

    return `${normalizedBase}-${suffix}`;
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

  private toReportMonth(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
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

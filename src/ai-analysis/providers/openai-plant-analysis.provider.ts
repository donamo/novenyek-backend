import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OverallStatus, PlantSize } from '@prisma/client';
import OpenAI from 'openai';
import {
  AiPlantAnalysisProvider,
  AnalyzePlantPhotosInput,
  AnalyzePlantPhotosResult,
  IdentifyPlantFromPhotoInput,
  IdentifyPlantFromPhotoResult,
} from '../ai-analysis.types';
import { resolveAiModel } from '../ai-model-resolver';

type AnalysisResponsePayload = AnalyzePlantPhotosResult;
type IdentificationResponsePayload = IdentifyPlantFromPhotoResult;

@Injectable()
export class OpenAiPlantAnalysisProvider implements AiPlantAnalysisProvider {
  private readonly logger = new Logger(OpenAiPlantAnalysisProvider.name);

  constructor(private readonly config: ConfigService) {}

  async analyzePlantPhotos(
    input: AnalyzePlantPhotosInput,
  ): Promise<AnalyzePlantPhotosResult> {
    const client = this.createClient();
    const imageContents = input.photoDataUrls.map((photoDataUrl) => ({
      type: 'input_image' as const,
      image_url: photoDataUrl,
      detail: 'high' as const,
    }));

    const response = await client.responses.create({
      model: this.getModel(),
      max_output_tokens: this.getIdentificationMaxOutputTokens(),
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text:
                'You are a plant care analysis assistant. Analyze the provided plant photos and return only JSON matching the supplied schema. Use Hungarian language for user-facing text fields.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: this.buildPhotoAnalysisPrompt(input),
            },
            ...imageContents,
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'plant_photo_analysis',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: [
              'overallStatus',
              'confidence',
              'observations',
              'possibleCauses',
              'recommendations',
              'riskLevel',
              'needsHumanReview',
              'shortSummary',
            ],
            properties: {
              overallStatus: {
                type: 'string',
                enum: ['good', 'medium', 'bad', 'unknown'],
              },
              confidence: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
              },
              observations: {
                type: 'array',
                items: { type: 'string' },
              },
              possibleCauses: {
                type: 'array',
                items: { type: 'string' },
              },
              recommendations: {
                type: 'array',
                items: { type: 'string' },
              },
              riskLevel: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
              },
              needsHumanReview: { type: 'boolean' },
              shortSummary: { type: 'string' },
            },
          },
        },
      },
    });

    const parsed = this.parseJson<AnalysisResponsePayload>(response.output_text);
    this.assertAnalysisResponse(parsed);
    return parsed;
  }

  async identifyPlantFromPhoto(
    input: IdentifyPlantFromPhotoInput,
  ): Promise<IdentifyPlantFromPhotoResult> {
    const client = this.createClient();
    const response = await client.responses.create({
      model: this.getModel(),
      max_output_tokens: this.getMaxOutputTokens(),
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text:
                'You identify houseplants from a single image and return only JSON matching the schema. Use Hungarian language for the summary and care text fields.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                input.language === 'hu'
                  ? `Azonositsd a novenyt a kep alapjan. Adj meg legvaloszinubb fajt, becsult cserepmeretet centimeterben, valamint a fajhoz illo gondozasi igenyeket. Minden szoveges mezo legyen rovid, tomor, legfeljebb 3-10 szo. Ha nem vagy biztos benne, allitsd a confidence mezot alacsonyabbra.${this.buildRoomContext(input)}`
                  : 'Identify the plant from the image.',
            },
            {
              type: 'input_image',
              image_url: input.photoDataUrl,
              detail: 'high',
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'plant_identification',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: [
              'commonName',
              'species',
              'category',
              'size',
              'potSizeCm',
              'careProfile',
              'confidence',
              'needsHumanReview',
              'shortSummary',
            ],
            properties: {
              commonName: { type: ['string', 'null'] },
              species: { type: ['string', 'null'] },
              category: { type: ['string', 'null'] },
              size: {
                type: ['string', 'null'],
                enum: ['small', 'medium', 'large', null],
              },
              potSizeCm: {
                type: ['integer', 'null'],
                minimum: 1,
                maximum: 200,
              },
              careProfile: {
                type: 'object',
                additionalProperties: false,
                required: [
                  'lightNeed',
                  'waterNeed',
                  'humidityNeed',
                  'temperatureNeed',
                  'soilNeed',
                  'fertilizingNeed',
                  'repottingFrequency',
                  'commonProblems',
                  'toxicity',
                ],
                properties: {
                  lightNeed: { type: ['string', 'null'] },
                  waterNeed: { type: ['string', 'null'] },
                  humidityNeed: { type: ['string', 'null'] },
                  temperatureNeed: { type: ['string', 'null'] },
                  soilNeed: { type: ['string', 'null'] },
                  fertilizingNeed: { type: ['string', 'null'] },
                  repottingFrequency: { type: ['string', 'null'] },
                  commonProblems: { type: ['string', 'null'] },
                  toxicity: { type: ['string', 'null'] },
                },
              },
              confidence: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
              },
              needsHumanReview: { type: 'boolean' },
              shortSummary: { type: 'string' },
            },
          },
        },
      },
    });

    const parsed = this.parseJson<IdentificationResponsePayload>(
      response.output_text,
    );
    this.assertIdentificationResponse(parsed);
    return parsed;
  }

  private createClient(): OpenAI {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY is not configured');
    }

    const project = this.config.get<string>('OPENAI_PROJECT_ID');
    const organization = this.config.get<string>('OPENAI_ORG_ID');

    return new OpenAI({
      apiKey,
      project: project || null,
      organization: organization || null,
    });
  }

  private getModel(): string {
    return resolveAiModel(this.config, 'openai');
  }

  private getMaxOutputTokens(): number {
    const rawValue = this.config.get<string>('AI_MAX_OUTPUT_TOKENS');
    const parsed = Number(rawValue);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 500;
    }

    return Math.floor(parsed);
  }

  private getIdentificationMaxOutputTokens(): number {
    return Math.max(this.getMaxOutputTokens(), 1200);
  }

  private buildPhotoAnalysisPrompt(input: AnalyzePlantPhotosInput): string {
    const roomSummary = input.room
      ? `Szoba: ${input.room.name}; tajolas: ${input.room.orientation ?? 'ismeretlen'}; feny: ${input.room.lightLevel ?? 'ismeretlen'}.`
      : 'Szobaadat nem all rendelkezesre.';

    return [
      `Elemezd a noveny allapotat ${input.photoDataUrls.length} kep alapjan.`,
      `Noveny neve: ${input.plantName ?? 'ismeretlen'}.`,
      `Faj: ${input.species ?? 'ismeretlen'}.`,
      roomSummary,
      'Adj rovid megfigyeleseket, valoszinu okokat, ajanlasokat es osszegzest.',
      'Ha a kep alapjan nem biztos a kovetkeztetes, allitsd a confidence mezot low-ra es needsHumanReview=true-ra.',
    ].join(' ');
  }

  private buildRoomContext(input: IdentifyPlantFromPhotoInput): string {
    if (!input.room) {
      return '';
    }

    return ` Helyseg kontextus: ${input.room.name}; tajolas: ${input.room.orientation ?? 'ismeretlen'}; feny: ${input.room.lightLevel ?? 'ismeretlen'}; paratartalom: ${input.room.humidityLevel ?? 'ismeretlen'}; atlaghomerseklet: ${input.room.averageTemperature ?? 'ismeretlen'}; megjegyzes: ${input.room.notes ?? 'nincs'}.`;
  }

  private parseJson<T>(value: string): T {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`OpenAI JSON parse failed: ${String(error)}`);
      throw new InternalServerErrorException(
        'OpenAI returned an invalid JSON payload',
      );
    }
  }

  private assertAnalysisResponse(
    value: AnalysisResponsePayload,
  ): asserts value is AnalysisResponsePayload {
    const validOverallStatus = new Set<OverallStatus>([
      OverallStatus.good,
      OverallStatus.medium,
      OverallStatus.bad,
      OverallStatus.unknown,
    ]);
    const validConfidence = new Set(['low', 'medium', 'high']);
    const validRisk = new Set(['low', 'medium', 'high']);

    if (
      !validOverallStatus.has(value.overallStatus) ||
      !validConfidence.has(value.confidence) ||
      !Array.isArray(value.observations) ||
      !Array.isArray(value.possibleCauses) ||
      !Array.isArray(value.recommendations) ||
      !validRisk.has(value.riskLevel) ||
      typeof value.needsHumanReview !== 'boolean' ||
      typeof value.shortSummary !== 'string'
    ) {
      throw new InternalServerErrorException(
        'OpenAI returned an invalid plant analysis payload',
      );
    }
  }

  private assertIdentificationResponse(
    value: IdentificationResponsePayload,
  ): asserts value is IdentificationResponsePayload {
    const validConfidence = new Set(['low', 'medium', 'high']);
    const validSizes = new Set<PlantSize | null>([
      PlantSize.small,
      PlantSize.medium,
      PlantSize.large,
      null,
    ]);

    if (
      !validConfidence.has(value.confidence) ||
      !validSizes.has(value.size ?? null) ||
      (value.potSizeCm !== undefined &&
        value.potSizeCm !== null &&
        (!Number.isInteger(value.potSizeCm) ||
          value.potSizeCm < 1 ||
          value.potSizeCm > 200)) ||
      typeof value.careProfile !== 'object' ||
      value.careProfile === null ||
      typeof value.needsHumanReview !== 'boolean' ||
      typeof value.shortSummary !== 'string'
    ) {
      throw new InternalServerErrorException(
        'OpenAI returned an invalid plant identification payload',
      );
    }
  }
}

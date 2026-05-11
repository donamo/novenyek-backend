import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OverallStatus, PlantSize } from '@prisma/client';
import OpenAI from 'openai';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
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
    const imageContents = await Promise.all(
      input.photoPaths.map(async (photoPath) => ({
        type: 'input_image' as const,
        image_url: await this.filePathToDataUrl(photoPath),
        detail: 'high' as const,
      })),
    );

    const response = await client.responses.create({
      model: this.getModel(),
      max_output_tokens: this.config.get<number>('AI_MAX_OUTPUT_TOKENS', 500),
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
      max_output_tokens: this.config.get<number>('AI_MAX_OUTPUT_TOKENS', 500),
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text:
                'You identify houseplants from a single image and return only JSON matching the schema. Use Hungarian language for the summary text.',
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
                  ? 'Azonositsd a novenyt a kep alapjan. Ha nem vagy biztos benne, add meg a legvaloszinubb fajt es allitsd a confidence mezot alacsonyabbra.'
                  : 'Identify the plant from the image.',
            },
            {
              type: 'input_image',
              image_url: await this.filePathToDataUrl(input.photoPath),
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

  private async filePathToDataUrl(filePath: string): Promise<string> {
    const buffer = await readFile(filePath);
    const mimeType = this.mimeTypeFromFilePath(filePath);
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }

  private mimeTypeFromFilePath(filePath: string): string {
    const extension = extname(filePath).toLowerCase();

    if (extension === '.png') {
      return 'image/png';
    }

    if (extension === '.webp') {
      return 'image/webp';
    }

    return 'image/jpeg';
  }

  private buildPhotoAnalysisPrompt(input: AnalyzePlantPhotosInput): string {
    const roomSummary = input.room
      ? `Szoba: ${input.room.name}; tajolas: ${input.room.orientation ?? 'ismeretlen'}; feny: ${input.room.lightLevel ?? 'ismeretlen'}.`
      : 'Szobaadat nem all rendelkezesre.';

    return [
      `Elemezd a noveny allapotat ${input.photoPaths.length} kep alapjan.`,
      `Noveny neve: ${input.plantName ?? 'ismeretlen'}.`,
      `Faj: ${input.species ?? 'ismeretlen'}.`,
      roomSummary,
      'Adj rovid megfigyeleseket, valoszinu okokat, ajanlasokat es osszegzest.',
      'Ha a kep alapjan nem biztos a kovetkeztetes, allitsd a confidence mezot low-ra es needsHumanReview=true-ra.',
    ].join(' ');
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
      typeof value.needsHumanReview !== 'boolean' ||
      typeof value.shortSummary !== 'string'
    ) {
      throw new InternalServerErrorException(
        'OpenAI returned an invalid plant identification payload',
      );
    }
  }
}

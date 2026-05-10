import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlantEventType } from '@prisma/client';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { PlantEventsService } from '../plant-events/plant-events.service';
import { PlantStatusReportsService } from '../plant-status-reports/plant-status-reports.service';
import { PlantsService } from '../plants/plants.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlantPhotoFromBase64Input } from './dto/create-plant-photo-from-base64.input';
import { UploadPlantPhotoDto } from './dto/upload-plant-photo.dto';

@Injectable()
export class PlantPhotosService {
  private readonly logger = new Logger(PlantPhotosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly plantsService: PlantsService,
    private readonly statusReportsService: PlantStatusReportsService,
    private readonly plantEventsService: PlantEventsService,
  ) {}

  async createFromUpload(
    ownerUserId: string,
    plantId: string,
    file: Express.Multer.File | undefined,
    input: UploadPlantPhotoDto,
  ) {
    if (!file) {
      throw new BadRequestException('Photo file is required');
    }

    await this.plantsService.ensureExists(ownerUserId, plantId);

    if (input.statusReportId) {
      await this.statusReportsService.ensurePlantReport(
        ownerUserId,
        plantId,
        input.statusReportId,
      );
    }

    const metadata = await sharp(file.path).metadata();
    const thumbnailPath = await this.createThumbnail(file.path);

    const photo = await this.prisma.plantPhoto.create({
      data: {
        plantId,
        ownerUserId,
        statusReportId: input.statusReportId,
        filePath: file.path,
        thumbnailPath,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        width: metadata.width,
        height: metadata.height,
        takenAt: input.takenAt,
        caption: input.caption,
      },
    });

    await this.plantEventsService.createSystemEvent({
      ownerUserId,
      plantId,
      type: PlantEventType.photo,
      title: 'Fotó feltöltve',
      description: input.caption,
      eventDate: input.takenAt,
    });

    this.logger.debug(`Photo uploaded from file: ${photo.id} plant=${plantId}`);

    return photo;
  }

  async createFromBase64(
    ownerUserId: string,
    input: CreatePlantPhotoFromBase64Input,
  ) {
    await this.plantsService.ensureExists(ownerUserId, input.plantId);

    if (input.statusReportId) {
      await this.statusReportsService.ensurePlantReport(
        ownerUserId,
        input.plantId,
        input.statusReportId,
      );
    }

    const parsed = this.parseBase64Image(input.imageBase64, input.mimeType);
    const uploadDir = this.config.get<string>('UPLOAD_DIR', './uploads');
    await mkdir(uploadDir, { recursive: true });

    const extension = this.extensionForMimeType(parsed.mimeType);
    const originalFilename =
      input.originalFilename ?? `${Date.now()}-${randomUUID()}${extension}`;
    const filePath = join(uploadDir, `${Date.now()}-${randomUUID()}${extension}`);

    await writeFile(filePath, parsed.buffer);

    const metadata = await sharp(filePath).metadata();
    const thumbnailPath = await this.createThumbnail(filePath);

    const photo = await this.prisma.plantPhoto.create({
      data: {
        ownerUserId,
        plantId: input.plantId,
        statusReportId: input.statusReportId,
        filePath,
        thumbnailPath,
        originalFilename,
        mimeType: parsed.mimeType,
        sizeBytes: parsed.buffer.byteLength,
        width: metadata.width,
        height: metadata.height,
        takenAt: input.takenAt,
        caption: input.caption,
      },
    });

    await this.plantEventsService.createSystemEvent({
      ownerUserId,
      plantId: input.plantId,
      type: PlantEventType.photo,
      title: 'Fotó feltöltve',
      description: input.caption,
      eventDate: input.takenAt,
    });

    this.logger.debug(
      `Photo uploaded from base64: ${photo.id} plant=${input.plantId}`,
    );

    return photo;
  }

  async findByPlant(ownerUserId: string, plantId: string) {
    await this.plantsService.ensureExists(ownerUserId, plantId);
    return this.prisma.plantPhoto.findMany({
      where: { ownerUserId, plantId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findByStatusReport(
    ownerUserId: string,
    plantId: string,
    statusReportId: string,
  ) {
    await this.statusReportsService.ensurePlantReport(
      ownerUserId,
      plantId,
      statusReportId,
    );
    return this.prisma.plantPhoto.findMany({
      where: { ownerUserId, plantId, statusReportId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findManyForAnalysis(
    ownerUserId: string,
    plantId: string,
    photoIds: string[],
  ) {
    const photos = await this.prisma.plantPhoto.findMany({
      where: { ownerUserId, plantId, id: { in: photoIds } },
    });

    if (photos.length !== photoIds.length) {
      throw new NotFoundException('One or more photos were not found');
    }

    return photos;
  }

  async remove(ownerUserId: string, photoId: string) {
    const photo = await this.prisma.plantPhoto.findFirst({
      where: { id: photoId, ownerUserId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    await this.prisma.plantPhoto.delete({ where: { id: photoId } });
    await this.unlinkIfExists(photo.filePath);

    if (photo.thumbnailPath) {
      await this.unlinkIfExists(photo.thumbnailPath);
    }

    this.logger.debug(`Photo deleted: ${photoId} owner=${ownerUserId}`);
    return { deleted: true };
  }

  private async createThumbnail(filePath: string): Promise<string> {
    const uploadDir = this.config.get<string>('UPLOAD_DIR', './uploads');
    const thumbnailDir = join(uploadDir, 'thumbnails');
    await mkdir(thumbnailDir, { recursive: true });

    const thumbnailPath = join(thumbnailDir, basename(filePath));
    await sharp(filePath)
      .rotate()
      .resize({ width: 300, height: 300, fit: 'inside' })
      .jpeg({ quality: 82 })
      .toFile(thumbnailPath);

    return thumbnailPath;
  }

  private async unlinkIfExists(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
    } catch {
      return;
    }
  }

  private parseBase64Image(
    imageBase64: string,
    fallbackMimeType?: string,
  ): { buffer: Buffer; mimeType: string } {
    const dataUrlMatch = /^data:([^;]+);base64,(.+)$/u.exec(imageBase64);
    const mimeType = dataUrlMatch?.[1] ?? fallbackMimeType ?? 'image/jpeg';
    const payload = dataUrlMatch?.[2] ?? imageBase64;

    if (!mimeType.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed');
    }

    return {
      buffer: Buffer.from(payload, 'base64'),
      mimeType,
    };
  }

  private extensionForMimeType(mimeType: string): string {
    if (mimeType === 'image/png') {
      return '.png';
    }

    if (mimeType === 'image/webp') {
      return '.webp';
    }

    return '.jpg';
  }
}

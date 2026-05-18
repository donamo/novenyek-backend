import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlantEventType } from '@prisma/client';
import { readFile, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { PlantEventsService } from '../plant-events/plant-events.service';
import { PlantStatusReportsService } from '../plant-status-reports/plant-status-reports.service';
import { PlantsService } from '../plants/plants.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReadOnlyPrismaService } from '../prisma/read-only-prisma.service';
import { CreatePlantPhotoFromBase64Input } from './dto/create-plant-photo-from-base64.input';
import { UploadPlantPhotoDto } from './dto/upload-plant-photo.dto';

@Injectable()
export class PlantPhotosService {
  private readonly logger = new Logger(PlantPhotosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly readOnlyPrisma: ReadOnlyPrismaService,
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

    const photoId = randomUUID();
    const imageBuffer = await this.resolveUploadBuffer(file);
    const metadata = await sharp(imageBuffer).metadata();
    const thumbnailData = await this.createThumbnail(imageBuffer);

    const photo = await this.prisma.plantPhoto.create({
      data: {
        id: photoId,
        plantId,
        ownerUserId,
        statusReportId: input.statusReportId,
        filePath: this.buildPhotoUrl(photoId),
        thumbnailPath: this.buildThumbnailUrl(photoId),
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        imageData: this.toPrismaBytes(imageBuffer),
        thumbnailData: this.toPrismaBytes(thumbnailData),
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
    const photoId = randomUUID();
    const extension = this.extensionForMimeType(parsed.mimeType);
    const originalFilename =
      input.originalFilename ?? `${Date.now()}-${photoId}${extension}`;
    const metadata = await sharp(parsed.buffer).metadata();
    const thumbnailData = await this.createThumbnail(parsed.buffer);

    const photo = await this.prisma.plantPhoto.create({
      data: {
        id: photoId,
        ownerUserId,
        plantId: input.plantId,
        statusReportId: input.statusReportId,
        filePath: this.buildPhotoUrl(photoId),
        thumbnailPath: this.buildThumbnailUrl(photoId),
        originalFilename,
        mimeType: parsed.mimeType,
        imageData: this.toPrismaBytes(parsed.buffer),
        thumbnailData: this.toPrismaBytes(thumbnailData),
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
    await this.plantsService.ensureExistsReadOnly(ownerUserId, plantId);
    return this.readOnlyPrisma.plantPhoto.findMany({
      where: { ownerUserId, plantId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findByStatusReport(
    ownerUserId: string,
    plantId: string,
    statusReportId: string,
  ) {
    await this.statusReportsService.ensurePlantReportReadOnly(
      ownerUserId,
      plantId,
      statusReportId,
    );
    return this.readOnlyPrisma.plantPhoto.findMany({
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
    await this.unlinkLegacyFilesIfNeeded(photo.filePath, photo.thumbnailPath);

    this.logger.debug(`Photo deleted: ${photoId} owner=${ownerUserId}`);
    return { deleted: true };
  }

  async getStoredImage(
    photoId: string,
    variant: 'original' | 'thumbnail',
  ): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const photo = await this.readOnlyPrisma.plantPhoto.findUnique({
      where: { id: photoId },
      select: {
        filePath: true,
        thumbnailPath: true,
        mimeType: true,
        imageData: true,
        thumbnailData: true,
      },
    });
    if (!photo) {
      return null;
    }

    if (variant === 'original') {
      if (photo.imageData) {
        return {
          buffer: Buffer.from(photo.imageData),
          mimeType: photo.mimeType,
        };
      }

      const buffer = await this.readLegacyFileIfNeeded(photo.filePath);
      return buffer
        ? {
            buffer,
            mimeType: photo.mimeType,
          }
        : null;
    }

    if (photo.thumbnailData) {
      return {
        buffer: Buffer.from(photo.thumbnailData),
        mimeType: 'image/jpeg',
      };
    }

    if (!photo.thumbnailPath) {
      return null;
    }

    const buffer = await this.readLegacyFileIfNeeded(photo.thumbnailPath);
    return buffer
      ? {
          buffer,
          mimeType: 'image/jpeg',
        }
      : null;
  }

  async toImageDataUrl(photo: {
    id: string;
    mimeType: string;
    imageData?: Uint8Array | Buffer | null;
    filePath: string;
  }): Promise<string> {
    if (photo.imageData) {
      return `data:${photo.mimeType};base64,${Buffer.from(photo.imageData).toString('base64')}`;
    }

    const legacyBuffer = await this.readLegacyFileIfNeeded(photo.filePath);
    if (!legacyBuffer) {
      throw new NotFoundException(`Photo binary not found: ${photo.id}`);
    }

    return `data:${photo.mimeType};base64,${legacyBuffer.toString('base64')}`;
  }

  private async createThumbnail(imageBuffer: Buffer): Promise<Buffer> {
    return sharp(imageBuffer)
      .rotate()
      .resize({ width: 300, height: 300, fit: 'inside' })
      .jpeg({ quality: 82 })
      .toBuffer();
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

  private async resolveUploadBuffer(file: Express.Multer.File): Promise<Buffer> {
    if (file.buffer?.byteLength) {
      return file.buffer;
    }

    if (file.path) {
      return readFile(file.path);
    }

    throw new BadRequestException('Photo file buffer is missing');
  }

  private buildPhotoUrl(photoId: string): string {
    return `/uploads/photos/${photoId}`;
  }

  private buildThumbnailUrl(photoId: string): string {
    return `/uploads/thumbnails/${photoId}`;
  }

  private async unlinkLegacyFilesIfNeeded(
    filePath: string,
    thumbnailPath?: string | null,
  ): Promise<void> {
    if (!this.isLegacyFilesystemPath(filePath)) {
      return;
    }

    await this.unlinkIfExists(filePath);

    if (thumbnailPath && this.isLegacyFilesystemPath(thumbnailPath)) {
      await this.unlinkIfExists(thumbnailPath);
    }
  }

  private async readLegacyFileIfNeeded(filePath: string): Promise<Buffer | null> {
    if (!this.isLegacyFilesystemPath(filePath)) {
      return null;
    }

    try {
      return await readFile(filePath);
    } catch {
      return null;
    }
  }

  private isLegacyFilesystemPath(filePath: string): boolean {
    return !filePath.startsWith('/uploads/');
  }

  private toPrismaBytes(buffer: Buffer): Uint8Array<ArrayBuffer> {
    return new Uint8Array(buffer);
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

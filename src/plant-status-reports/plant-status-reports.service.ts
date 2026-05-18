import { Injectable, NotFoundException } from '@nestjs/common';
import { PlantsService } from '../plants/plants.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReadOnlyPrismaService } from '../prisma/read-only-prisma.service';
import { CreatePlantStatusReportDto } from './dto/create-plant-status-report.dto';
import { UpdatePlantStatusReportDto } from './dto/update-plant-status-report.dto';

@Injectable()
export class PlantStatusReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readOnlyPrisma: ReadOnlyPrismaService,
    private readonly plantsService: PlantsService,
  ) {}

  async findByPlant(ownerUserId: string, plantId: string) {
    await this.plantsService.ensureExistsReadOnly(ownerUserId, plantId);
    return this.readOnlyPrisma.plantStatusReport.findMany({
      where: { ownerUserId, plantId },
      orderBy: { reportMonth: 'desc' },
      include: {
        photos: { orderBy: { uploadedAt: 'desc' } },
        aiAnalyses: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async findOne(ownerUserId: string, plantId: string, id: string) {
    const report = await this.readOnlyPrisma.plantStatusReport.findFirst({
      where: { id, ownerUserId, plantId },
      include: {
        photos: { orderBy: { uploadedAt: 'desc' } },
        aiAnalyses: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!report) {
      throw new NotFoundException('Status report not found');
    }

    return report;
  }

  async create(
    ownerUserId: string,
    plantId: string,
    input: CreatePlantStatusReportDto,
  ) {
    await this.plantsService.ensureExists(ownerUserId, plantId);
    return this.prisma.plantStatusReport.create({
      data: { ...input, ownerUserId, plantId },
    });
  }

  async update(
    ownerUserId: string,
    plantId: string,
    id: string,
    input: UpdatePlantStatusReportDto,
  ) {
    await this.ensurePlantReport(ownerUserId, plantId, id);
    return this.prisma.plantStatusReport.update({
      where: { id },
      data: input,
    });
  }

  async updateAiSummary(
    ownerUserId: string,
    plantId: string,
    id: string,
    input: { aiSummary: string; aiRecommendations: string },
  ) {
    await this.ensurePlantReport(ownerUserId, plantId, id);
    return this.prisma.plantStatusReport.update({
      where: { id },
      data: input,
    });
  }

  async remove(ownerUserId: string, plantId: string, id: string) {
    await this.ensurePlantReport(ownerUserId, plantId, id);
    await this.prisma.plantStatusReport.delete({ where: { id } });
    return { deleted: true };
  }

  async ensurePlantReport(
    ownerUserId: string,
    plantId: string,
    id: string,
  ): Promise<void> {
    const report = await this.prisma.plantStatusReport.findFirst({
      where: { id, ownerUserId, plantId },
      select: { id: true },
    });

    if (!report) {
      throw new NotFoundException('Status report not found');
    }
  }

  async ensurePlantReportReadOnly(
    ownerUserId: string,
    plantId: string,
    id: string,
  ): Promise<void> {
    const report = await this.readOnlyPrisma.plantStatusReport.findFirst({
      where: { id, ownerUserId, plantId },
      select: { id: true },
    });

    if (!report) {
      throw new NotFoundException('Status report not found');
    }
  }
}

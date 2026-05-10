import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';

const plantInclude = {
  room: true,
  requirement: true,
  _count: {
    select: {
      events: true,
      statusReports: true,
      photos: true,
      aiAnalyses: true,
    },
  },
};

@Injectable()
export class PlantsService {
  private readonly logger = new Logger(PlantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  findAll(ownerUserId: string) {
    return this.prisma.plant.findMany({
      where: { ownerUserId },
      orderBy: [{ name: 'asc' }],
      include: {
        room: true,
        statusReports: {
          orderBy: { reportMonth: 'desc' },
          take: 1,
        },
        photos: {
          orderBy: { uploadedAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async findOne(ownerUserId: string, id: string) {
    const plant = await this.prisma.plant.findFirst({
      where: { id, ownerUserId },
      include: plantInclude,
    });

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }

    return plant;
  }

  async create(ownerUserId: string, input: CreatePlantDto) {
    if (input.roomId) {
      await this.ensureRoomExists(ownerUserId, input.roomId);
    }

    const plant = await this.prisma.plant.create({
      data: { ...input, ownerUserId },
      include: plantInclude,
    });
    this.logger.debug(`Plant created: ${plant.id} owner=${ownerUserId}`);
    return plant;
  }

  async update(ownerUserId: string, id: string, input: UpdatePlantDto) {
    await this.ensureExists(ownerUserId, id);

    if (input.roomId) {
      await this.ensureRoomExists(ownerUserId, input.roomId);
    }

    const plant = await this.prisma.plant.update({
      where: { id },
      data: input,
      include: plantInclude,
    });
    this.logger.debug(`Plant updated: ${plant.id} owner=${ownerUserId}`);
    return plant;
  }

  async remove(ownerUserId: string, id: string) {
    await this.ensureExists(ownerUserId, id);
    await this.prisma.plant.delete({ where: { id } });
    this.logger.debug(`Plant deleted: ${id} owner=${ownerUserId}`);
    return { deleted: true };
  }

  async ensureExists(ownerUserId: string, id: string): Promise<void> {
    const plant = await this.prisma.plant.findFirst({
      where: { id, ownerUserId },
      select: { id: true },
    });

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }
  }

  private async ensureRoomExists(ownerUserId: string, id: string): Promise<void> {
    const room = await this.prisma.room.findFirst({
      where: { id, ownerUserId },
      select: { id: true },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }
  }
}

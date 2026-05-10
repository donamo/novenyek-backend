import { Injectable, NotFoundException } from '@nestjs/common';
import { PlantEventType } from '@prisma/client';
import { PlantsService } from '../plants/plants.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlantEventDto } from './dto/create-plant-event.dto';
import { UpdatePlantEventDto } from './dto/update-plant-event.dto';

@Injectable()
export class PlantEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plantsService: PlantsService,
  ) {}

  async findByPlant(ownerUserId: string, plantId: string) {
    await this.plantsService.ensureExists(ownerUserId, plantId);
    return this.prisma.plantEvent.findMany({
      where: { ownerUserId, plantId },
      orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(ownerUserId: string, plantId: string, input: CreatePlantEventDto) {
    await this.plantsService.ensureExists(ownerUserId, plantId);
    return this.prisma.plantEvent.create({
      data: { ...input, ownerUserId, plantId },
    });
  }

  async createSystemEvent(input: {
    ownerUserId: string;
    plantId: string;
    type: PlantEventType;
    title: string;
    description?: string;
    eventDate?: Date;
  }) {
    return this.prisma.plantEvent.create({
      data: {
        ownerUserId: input.ownerUserId,
        plantId: input.plantId,
        type: input.type,
        title: input.title,
        description: input.description,
        eventDate: input.eventDate ?? new Date(),
      },
    });
  }

  async update(
    ownerUserId: string,
    plantId: string,
    eventId: string,
    input: UpdatePlantEventDto,
  ) {
    await this.ensurePlantEvent(ownerUserId, plantId, eventId);
    return this.prisma.plantEvent.update({
      where: { id: eventId },
      data: input,
    });
  }

  async remove(ownerUserId: string, plantId: string, eventId: string) {
    await this.ensurePlantEvent(ownerUserId, plantId, eventId);
    await this.prisma.plantEvent.delete({ where: { id: eventId } });
    return { deleted: true };
  }

  private async ensurePlantEvent(
    ownerUserId: string,
    plantId: string,
    eventId: string,
  ): Promise<void> {
    const event = await this.prisma.plantEvent.findFirst({
      where: { id: eventId, ownerUserId, plantId },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundException('Plant event not found');
    }
  }
}

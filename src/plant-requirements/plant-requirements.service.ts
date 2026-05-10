import { Injectable } from '@nestjs/common';
import { PlantsService } from '../plants/plants.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertPlantRequirementDto } from './dto/upsert-plant-requirement.dto';

@Injectable()
export class PlantRequirementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plantsService: PlantsService,
  ) {}

  async findByPlant(ownerUserId: string, plantId: string) {
    await this.plantsService.ensureExists(ownerUserId, plantId);
    return this.prisma.plantRequirement.findUnique({ where: { plantId } });
  }

  async upsert(
    ownerUserId: string,
    plantId: string,
    input: UpsertPlantRequirementDto,
  ) {
    await this.plantsService.ensureExists(ownerUserId, plantId);
    return this.prisma.plantRequirement.upsert({
      where: { plantId },
      create: { ...input, ownerUserId, plantId },
      update: input,
    });
  }
}

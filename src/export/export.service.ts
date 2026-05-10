import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportPlantJson(ownerUserId: string, plantId: string) {
    return this.getPlantExport(ownerUserId, plantId);
  }

  async exportPlantJsonString(
    ownerUserId: string,
    plantId: string,
  ): Promise<string> {
    const plant = await this.getPlantExport(ownerUserId, plantId);
    return JSON.stringify(plant, null, 2);
  }

  async exportPlantMarkdown(
    ownerUserId: string,
    plantId: string,
  ): Promise<string> {
    const plant = await this.getPlantExport(ownerUserId, plantId);
    const lines: string[] = [
      `# ${plant.name}`,
      '',
      '## Alapadatok',
      '',
      `- Hely: ${plant.room?.name ?? 'nincs megadva'}`,
      `- Állapot: ${plant.status}`,
    ];

    if (plant.species) {
      lines.push(`- Faj: ${plant.species}`);
    }

    if (plant.locationDescription) {
      lines.push(`- Pontos hely: ${plant.locationDescription}`);
    }

    if (plant.notes) {
      lines.push('', 'Megjegyzés:', plant.notes);
    }

    if (plant.requirement) {
      lines.push('', '## Gondozási igények', '');
      this.pushOptional(lines, 'Fény', plant.requirement.lightNeed);
      this.pushOptional(lines, 'Víz', plant.requirement.waterNeed);
      this.pushOptional(lines, 'Pára', plant.requirement.humidityNeed);
      this.pushOptional(lines, 'Hőmérséklet', plant.requirement.temperatureNeed);
      this.pushOptional(lines, 'Talaj', plant.requirement.soilNeed);
    }

    for (const report of plant.statusReports) {
      lines.push('', `## ${report.reportMonth} havi státusz`, '');
      lines.push(`Állapot: ${report.overallStatus}`);
      this.pushParagraph(lines, 'Levél állapota', report.leafStatus);
      this.pushParagraph(lines, 'Növekedés', report.growthStatus);
      this.pushParagraph(lines, 'Föld állapota', report.soilStatus);
      this.pushParagraph(lines, 'Megjegyzés', report.notes);
      this.pushParagraph(lines, 'AI összefoglaló', report.aiSummary);
      this.pushParagraph(lines, 'AI javaslatok', report.aiRecommendations);
    }

    if (plant.events.length > 0) {
      lines.push('', '## Események', '');
      for (const event of plant.events) {
        const date = event.eventDate.toISOString().slice(0, 10);
        lines.push(`- ${date} - ${event.title} (${event.type})`);
        if (event.description) {
          lines.push(`  ${event.description}`);
        }
      }
    }

    return `${lines.join('\n')}\n`;
  }

  private async getPlantExport(ownerUserId: string, plantId: string) {
    const plant = await this.prisma.plant.findFirst({
      where: { id: plantId, ownerUserId },
      include: {
        room: true,
        requirement: true,
        statusReports: {
          orderBy: { reportMonth: 'desc' },
          include: {
            photos: { orderBy: { uploadedAt: 'desc' } },
            aiAnalyses: { orderBy: { createdAt: 'desc' } },
          },
        },
        events: { orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }] },
        photos: { orderBy: { uploadedAt: 'desc' } },
        aiAnalyses: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }

    return plant;
  }

  private pushOptional(lines: string[], label: string, value?: string | null) {
    if (value) {
      lines.push(`- ${label}: ${value}`);
    }
  }

  private pushParagraph(lines: string[], label: string, value?: string | null) {
    if (value) {
      lines.push('', `${label}:`, value);
    }
  }
}

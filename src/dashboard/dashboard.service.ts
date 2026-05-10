import { Injectable } from '@nestjs/common';
import { OverallStatus, PlantStatus } from '@prisma/client';
import { AiAnalysisService } from '../ai-analysis/ai-analysis.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiAnalysisService: AiAnalysisService,
  ) {}

  async getDashboard(ownerUserId: string) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [
      totalPlants,
      activePlants,
      latestStatusReports,
      latestAiAnalyses,
      plantsMissingMonthlyStatus,
    ] = await Promise.all([
      this.prisma.plant.count({ where: { ownerUserId } }),
      this.prisma.plant.count({
        where: { ownerUserId, status: PlantStatus.active },
      }),
      this.prisma.plantStatusReport.findMany({
        where: { ownerUserId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { plant: { select: { id: true, name: true } } },
      }),
      this.prisma.aiAnalysis.findMany({
        where: { ownerUserId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { plant: { select: { id: true, name: true } } },
      }),
      this.prisma.plant.count({
        where: {
          ownerUserId,
          status: PlantStatus.active,
          statusReports: {
            none: { reportMonth: currentMonth },
          },
        },
      }),
    ]);

    const good = latestStatusReports.filter(
      (report) => report.overallStatus === OverallStatus.good,
    ).length;
    const watch = latestStatusReports.filter(
      (report) => report.overallStatus === OverallStatus.medium,
    ).length;
    const problematic = latestStatusReports.filter(
      (report) => report.overallStatus === OverallStatus.bad,
    ).length;

    return {
      totals: {
        plants: totalPlants,
        activePlants,
        goodStatusReports: good,
        watchStatusReports: watch,
        problematicStatusReports: problematic,
        missingMonthlyStatus: plantsMissingMonthlyStatus,
      },
      currentMonth,
      latestStatusReports,
      latestAiAnalyses: latestAiAnalyses.map((analysis) =>
        this.aiAnalysisService.toModel(analysis),
      ),
    };
  }
}

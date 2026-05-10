import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AiAnalysisModel } from '../../ai-analysis/models/ai-analysis.model';
import { PlantStatusReportModel } from '../../plant-status-reports/models/plant-status-report.model';

@ObjectType()
export class DashboardTotalsModel {
  @Field(() => Int)
  plants!: number;

  @Field(() => Int)
  activePlants!: number;

  @Field(() => Int)
  goodStatusReports!: number;

  @Field(() => Int)
  watchStatusReports!: number;

  @Field(() => Int)
  problematicStatusReports!: number;

  @Field(() => Int)
  missingMonthlyStatus!: number;
}

@ObjectType()
export class DashboardModel {
  @Field(() => DashboardTotalsModel)
  totals!: DashboardTotalsModel;

  @Field()
  currentMonth!: string;

  @Field(() => [PlantStatusReportModel])
  latestStatusReports!: PlantStatusReportModel[];

  @Field(() => [AiAnalysisModel])
  latestAiAnalyses!: AiAnalysisModel[];
}

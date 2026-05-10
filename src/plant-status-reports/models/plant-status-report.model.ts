import { Field, ID, ObjectType } from '@nestjs/graphql';
import { OverallStatus, PestSuspicion } from '@prisma/client';

@ObjectType()
export class PlantStatusReportModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  ownerUserId!: string;

  @Field(() => ID)
  plantId!: string;

  @Field()
  reportMonth!: string;

  @Field(() => OverallStatus)
  overallStatus!: OverallStatus;

  @Field(() => String, { nullable: true })
  leafStatus?: string | null;

  @Field(() => String, { nullable: true })
  growthStatus?: string | null;

  @Field(() => String, { nullable: true })
  soilStatus?: string | null;

  @Field(() => PestSuspicion, { nullable: true })
  pestSuspicion?: PestSuspicion | null;

  @Field(() => String, { nullable: true })
  wateringAssessment?: string | null;

  @Field(() => String, { nullable: true })
  lightAssessment?: string | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => String, { nullable: true })
  aiSummary?: string | null;

  @Field(() => String, { nullable: true })
  aiRecommendations?: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
